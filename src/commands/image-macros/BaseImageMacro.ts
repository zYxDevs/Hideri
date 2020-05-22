import Jimp from 'jimp';
import { CommandMessage, Client } from '@typeit/discord';
import { MessageAttachment } from 'discord.js';
import { Font } from '@jimp/plugin-print';
import fetch from 'node-fetch';
import { ImageProcessorHandler, ImageProcessingError } from '../../workers/ImageProcessorHandler';
import { create_logger } from '../../utils/Logger';

const logger = create_logger(module);

export abstract class BaseImageMacro {
    public frame: {
        x: number,
        y: number,
        width: number,
        height: number,
        rot: number
    };

    public static font_cache = new Map<string, Promise<Font>>();

    public static image_cache = new Map<string, Promise<Jimp>>();

    private static url_regex = /^<?((?:(?:http|https|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:((?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))))(?::\d{2,5})?(?:(?:\/|\?|#)[^\s]*?)?)>?$/i;

    private static private_ip_regex = /^(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|(?:169\.254|192\.168)\.\d{1,3}\.\d{1,3}|2[4-5][0-9]\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

    private static image_extension_regex = /\.(png|jpe?g|jfif|gif|bmp|tiff)$/i;

    private static default_fonts = [
        `${__dirname}/../../assets/fonts/opensans-black-128-emoji/opensans-black-128-emoji.fnt`,
        `${__dirname}/../../assets/fonts/opensans-black-64-emoji/opensans-black-64-emoji.fnt`,
        `${__dirname}/../../assets/fonts/opensans-black-32-emoji/opensans-black-32-emoji.fnt`,
        `${__dirname}/../../assets/fonts/opensans-black-16-emoji/opensans-black-16-emoji.fnt`
    ];

    constructor(private options: {
        image_location: string,
        mask_location: string,
        fonts?: string[],
        mime?: string,
        output_filename?: string
    }) {  }

    private get_extension(mime: string) {
        switch (mime) {
            case Jimp.MIME_X_MS_BMP:
            case Jimp.MIME_BMP: return 'bmp';
            case Jimp.MIME_GIF: return 'gif';
            case Jimp.MIME_JPEG: return 'jpeg';
            case Jimp.MIME_PNG: return 'png';
            case Jimp.MIME_TIFF: return 'tiff';

            default: return 'out';
        }
    }

    public async exec(message: CommandMessage, client: Client, ...text_or_images: string[]) {
        message.channel.startTyping();

        let emojis: string[] = [];
        const segments: ({ type: 'text' | 'image', data: string })[] = [];

        if (text_or_images.length == 1 && text_or_images[0] == '!!') {
            const last_message = [...message.channel.messages.cache].reverse().find(([,channel_message]) => {
                if (!channel_message) return false;
                if (channel_message.author == client.user) return false;
                if (channel_message == message) return false;
                if (channel_message.content?.startsWith('<')) return false;
                
                return true;
            });
            
            if (!last_message) return;
            const attachment = last_message[1].attachments.find(attachment => BaseImageMacro.image_extension_regex.test(attachment.url));

            if (last_message[1].content) {
                segments.push({
                    type: 'text',
                    data: last_message[1].content.trim()
                })
            }
            
            if (attachment) {
                segments.push({
                    type: 'image',
                    data: attachment.url
                });
            }
        } else if (text_or_images.length == 0) {
            const attachment = message.attachments.find(attachment => BaseImageMacro.image_extension_regex.test(attachment.url));

            if (attachment) {
                segments.push({
                    type: 'image',
                    data: attachment.url
                });
            }
        } else {
            for (let segment of text_or_images) {
                let [ ,url, ip ] = (segment.match(BaseImageMacro.url_regex) || []);
                if (url && !BaseImageMacro.private_ip_regex.test(ip || '')) {
                    if (!/^(?:https?|ftp):\/\//i.test(url)) url = `http://${url}`;

                    const exists = await fetch(url, {
                        method: 'HEAD',
                        timeout: 1000
                    }).then(() => true).catch(() => false);

                    if (exists) {
                        segments.push({
                            type: 'image',
                            data: url
                        });
                        continue;
                    }
                }

                const [, emoji ] = (segment.match(/<:[\w~]+:(\d+)>/) || []);
                if (emoji) {
                    emojis.push(`https://cdn.discordapp.com/emojis/${emoji}.png`);
                    segment = '\ufffc';
                }

                const [, user_id ] = (segment.match(/<@!(\d+)>/) || []);
                if (user_id) {
                    const member = message.guild.members.cache.find(member => member.id == user_id);
                    if (member && member.user.avatarURL()) {
                        segments.push({
                            type: 'image',
                            data: member.user.avatarURL({
                                format: 'png',
                                size: 512
                            })
                        });
                        continue;
                    }
                }

                if (segments[segments.length - 1]?.type != 'text') {
                    segments.push({ type: 'text', data: segment.trim() });
                } else {
                    segments[segments.length - 1].data += ` ${segment.trim()}`;
                }
            }
        }

        const start = Date.now();

        const result = await ImageProcessorHandler.process({
            image_location: this.options.image_location,
            mask_location: this.options.mask_location,
            fonts: this.options.fonts ?? BaseImageMacro.default_fonts,
            mime: this.options.mime ?? Jimp.MIME_JPEG,
            frame: this.frame,
            segments: segments,
            emojis: emojis
        }).catch((error: ImageProcessingError) => error);

        if (result instanceof ImageProcessingError) return message.reply(`Error: ${result.message}`);

        logger.verbose(`image processed after ${Date.now() - start}ms`);

        message.channel.send(new MessageAttachment(Buffer.from(result.data), `${this.options.output_filename ?? 'output'}.${this.get_extension(this.options.mime ?? Jimp.MIME_JPEG)}`));
    }
}