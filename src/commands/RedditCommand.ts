import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import fetch from 'node-fetch';
import { SetArgumentType } from '../argument-types/SetArgumentType';
import { RandomUtils } from '../utils/RandomUtils';
import { CommandMessage, Discord } from '@typeit/discord';
import { EmbedUtils } from '../utils/EmbedUtils';
import config from '../configs/config.json';
import { get_prefix, server_configs } from '../server-config/ServerConfig';
import { TextChannel } from 'discord.js';

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

@Discord(get_prefix)
export abstract class RedditCommand {
    @Command('r', {
        infos: 'Fetch top post of subreddit',
        group: CommandGroup.COMMUNITIES,
        aliases: ['reddit']
    })
    private async r(message: CommandMessage, subreddit: string, status: RedditStatusType, timeframe: RedditTimeType, post_number: string = '0') {
        message.channel.startTyping();

        const data = await fetch(`https://www.reddit.com/r/${subreddit}/${status.get()}/.json?limit=100${timeframe.get() ? ('&t=' + timeframe.get()) : ''}`);
        const response = await data.json();

        if (response.error == 404 || data.url.includes('/subreddits/search.json?q=')) return message.channel.send(`Error: unknown subreddit`);

        const items = response.data.children.filter(({ data }) => !data.is_self && !data.stickied);
        let post_index = parseInt(post_number as string);
        if (Number.isNaN(post_index)) post_index = 0;
        if (post_number == 'r') post_index = RandomUtils.randint(0, items.length);
        const post = items[post_number].data;

        if (post.over_18 &&
            !(message?.channel as TextChannel)?.nsfw &&
            !server_configs[message?.guild?.id]['common.nsfw_all_channels']
            ) {
            message.channel.stopTyping();
            return message.react('💢');
        }

        let img = post.url;
        if (!/\.(jpe?g|png|gif)$/ig.test(img)) img = post?.preview?.images[0]?.source?.url?.replace(/&amp;/ig, '&');
        message.channel.send(EmbedUtils.create_image_embed(post.title, img));
    }
}