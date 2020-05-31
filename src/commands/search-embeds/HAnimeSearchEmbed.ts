import { BaseSearchEmbed } from './BaseSearchEmbed';
import { Client, Message } from 'discord.js';
import { CommandMessage, Discord } from '@typeit/discord';
import { CommandGroup } from '../../types/CommandGroup';
import { Command } from '../../ArgumentParser';
import { RestAsString } from '../../argument-types/RestAsString';
import { hanime } from '../../apis/Instances';
import { RandomUtils } from '../../utils/RandomUtils';
import { get_prefix } from '../../server-config/ServerConfig';
import { HAnimeEmbedBrowser } from '../../embed-browsers/HAnimeEmbedBrowser';
import string_similarity from 'string-similarity';

@Discord(get_prefix)
export class HAnimeSearchEmbed extends BaseSearchEmbed {
    public pattern = /(?:\s|^)\/([\S ]{8,64})\/(?:\s|$)/g;

    public name = 'HAnime';
    public info = 'Fetch video from hanime';
    public usage = '/video name/';
    public nsfw = true;

    public associated_command = 'ha';

    @Command('ha', {
        description: 'Get random video from hanime',
        group: CommandGroup.COMMUNITIES,
        aliases: ['hanime'],
        nsfw: true
    })
    private async exec(message: CommandMessage, query: RestAsString) {
        message.channel.startTyping();
        
        let results = await hanime.search(query.get());
        if (!results.hits) return message.reply('No search results found');

        const page = RandomUtils.randint(0, results.pages - 1);
        if (page) results = await hanime.search(query.get(), {
            page: page
        });

        const video = await hanime.get_video(RandomUtils.choice(results.videos));
        new HAnimeEmbedBrowser(video).send_embed(message);
    }


    public async embed_handler(message: Message, client: Client, match: RegExpMatchArray) {
        const query = match[1].replace(/\s+/g, ' ');

        const results = await hanime.search({
            search_text: query
        });

        if (!results.hits) {
            message.reply(`Unable to fetch video ${query}`);
            return null;
        }

        const video_title = string_similarity.findBestMatch(query, results.videos.map(video => video.name)).bestMatch.target;
        const video_info = results.videos.find(video => video.name == video_title);

        const video = await hanime.get_video(video_info ?? results.videos[0]);

        return new HAnimeEmbedBrowser(video);
    }
}