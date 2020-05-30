import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { Client } from '@typeit/discord';

const default_image_options = {
    avatars: true,
    attachments: true,
    emojis: true,
    history_expansion: true
};

type DefaultGetImageOptions = { [P in keyof typeof default_image_options]?: (typeof default_image_options)[P] };

export abstract class MessageUtils {
    private static url_regex = /^<?((?:(?:http|https|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:((?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))))(?::\d{2,5})?(?:(?:\/|\?|#)[^\s]*?)?)>?$/i;

    private static private_ip_regex = /^(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|(?:169\.254|192\.168)\.\d{1,3}\.\d{1,3}|2[4-5][0-9]\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

    private static emoji_regex = /^<:\S+:\d{17,20}>$/i;

    private static mention_regex = /^<@!\d{17,20}>$/;

    private static image_extension_regex = /\.(png|jpe?g|jfif|gif|bmp|tiff)$/i;

    public static async get_image(param: string, message: Message, client: Client, options?: DefaultGetImageOptions) {
        options = Object.assign({}, default_image_options, options);

        param = (param ?? '').trim();

        if (param.startsWith('<') && param.endsWith('>')) param = param.slice(1, -1);

        if (this.url_regex.test(param) && !this.private_ip_regex.test(param)) {
            const url = /^(https?|ftp):\/\//i.test(param) ? param : `http://${param}`;

            const response = await fetch(url, {
                method: 'HEAD'
            });

            if (response.status == 200 && response.headers.get('Content-Type')?.startsWith('image')) return url;
        }

        if (options.emojis && this.emoji_regex.test(param)) {
            const id = param.match(/\d{17,20}/)[0];

            return `https://cdn.discordapp.com/emojis/${id}.png`;
        }

        if (options.avatars && this.mention_regex.test(param)) {
            const id = param.match(/\d{17,20}/)[0];
            const user = message.mentions.users.find(user => user.id == id);

            if (user) return user.avatarURL({
                format: 'png',
                size: 2048
            });
        }

        if (options.attachments) {
            const attachment = message.attachments.find(attachment => this.image_extension_regex.test(attachment.url));

            if (attachment) return attachment.url;
        }

        if (param == '!!' && options.history_expansion) {
            const last_message = [...message.channel.messages.cache].reverse().find(([,channel_message]) => {
                if (!channel_message) return false;
                if (channel_message.author == client.user) return false;
                if (channel_message == message) return false;
                if (channel_message.content?.startsWith('<')) return false;
                
                return true;
            })?.[1];

            if (last_message) {
                return await this.get_image(last_message.content, last_message, client, Object.assign({}, options, {
                    history_expansion: false
                }));
            }
        }

        return null;
    }
}