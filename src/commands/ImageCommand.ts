import { Command } from '../ArgumentParser';
import { Discord, CommandMessage } from '@typeit/discord';
import config from '../config.json';
import fetch from 'node-fetch';
import { MessageEmbed } from 'discord.js';
import NekosClient from 'nekos.life';
import neko_tags from '../neko_tags.json';
import { StringUtils } from '../utils/StringUtils';
import { RandomUtils } from '../utils/RandomUtils';
import { SetArgumentType } from '../argument-types/SetArgumentType';
import { RestAsString } from '../argument-types/RestAsString';
import { CommandGroup } from '../types/CommandGroup';

class NekosArgumentType extends SetArgumentType {
    public argument_list = [...neko_tags, 'OwOify', 'spoiler'];
}

class RedditStatusType extends SetArgumentType {
    public argument_list = ['hot', 'rising', 'new', 'top'];
    public optional = true;
    public default = 'hot';
}

class RedditTimeType extends SetArgumentType {
    public argument_list = ['hour', 'day', 'week', 'month', 'year', 'all'];
    public default = '';
    public optional = true;
}

@Discord({
    prefix: config.prefix
})
export abstract class ImageCommand {
    private nekos_client = new NekosClient();

    private create_embed(name: string, url?: string) {
        const embed = new MessageEmbed();
        embed.setAuthor(name, undefined, url);
        if (url) embed.setImage(url);
        return embed;
    }

    @Command('ahegao', {
        infos: 'Get random ahegao picture',
        group: CommandGroup.COMMUNITIES
    })
    async ahegao(message: CommandMessage) {
        message.channel.startTyping();
        const { msg } = await (await fetch('https://ahegao.egecelikci.com/api')).json();
        message.channel.send(this.create_embed('Ahegao Result', msg));
    }

    @Command('neko', {
        infos: 'Fetch image from nekos.life',
        group: CommandGroup.COMMUNITIES,
        rest_required: false
    })
    async neko(message: CommandMessage, tag_type: NekosArgumentType, text: RestAsString) {
        const tag = tag_type.get();
        if (StringUtils.ci_includes(neko_tags, tag)) {
            message.channel.startTyping();
            let location = 'sfw'
            if (StringUtils.ci_get(this.nekos_client.nsfw, tag)) location = 'nsfw';
            const response = await StringUtils.ci_get(this.nekos_client[location], tag)();
            if (!response.url) return message.channel.send(response.cat ?? response.why ?? response.owo ?? response.fact ?? response.msg);
            const embed = new MessageEmbed();
            embed.setImage(response.url);
            if (!response.response) {
                embed.setAuthor('Nekos Result', undefined, response.url);
            } else {
                embed.addField('8Ball Says:', response.response, true);
            }
            message.channel.send(embed);
        } else {
            let text_str = text.get().trim();
            if (!text_str) return message.reply(`Error: missing argument \`text\``);
            message.channel.startTyping();
            const response = await StringUtils.ci_get(this.nekos_client.sfw, tag)({ text: text_str });
            message.channel.send(response.msg || response.owo);
        }
    }

    @Command('r', {
        infos: 'Fetch top post of subreddit',
        group: CommandGroup.COMMUNITIES,
        aliases: ['reddit']
    })
    async r(message: CommandMessage, subreddit: string, status: RedditStatusType, timeframe: RedditTimeType, post_number: string = '0') {
        message.channel.startTyping();

        const response = await (await fetch(`https://www.reddit.com/r/${subreddit}/${status.get()}/.json?limit=100${timeframe.get() ? ('&t=' + timeframe.get()) : ''}`)).json();
        const items = response.data.children.filter(({ data }) => !data.is_self && !data.stickied);
        let post_index = parseInt(post_number as string);
        if (Number.isNaN(post_index)) post_index = 0;
        if (post_number == 'r') post_index = RandomUtils.randint(0, items.length);
        const post = items[post_number].data;
        let img = post.url;
        if (!/\.(jpe?g|png|gif)$/ig.test(img)) img = post?.preview?.images[0]?.source?.url?.replace(/&amp;/ig, '&');
        message.channel.send(this.create_embed(post.title, img));
    }
}