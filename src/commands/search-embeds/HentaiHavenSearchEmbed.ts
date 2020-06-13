import { BaseSearchEmbed } from './BaseSearchEmbed';
import { Discord, Client, CommandMessage } from '@typeit/discord';
import { get_prefix } from '../../server-config/ServerConfig';
import { Message } from 'discord.js';
import { RestAsString } from '../../argument-types/RestAsString';
import { Command } from '../../ArgumentParser';
import { CommandGroup } from '../../types/CommandGroup';
import { hentaihaven } from '../../apis/Instances';
import { RandomUtils } from '../../utils/RandomUtils';
import { HentaiHavenEmbedBrowser } from '../../embed-browsers/HentaiHavenEmbedBrowser';
import string_similarity from 'string-similarity';

@Discord(get_prefix)
export class HentaiHavenSearchEmbed extends BaseSearchEmbed {
    public pattern = /(?:\s|^)H\(([\S ]{8,64})\)H(?:\s|$)/g;

    public name = 'HentaiHaven';
    public info = 'Fetch video from hentaihaven';
    public usage = 'H(video name)H';
    public nsfw = true;

    public associated_command = 'hentaihaven';

    @Command('hentaihaven', {
        description: 'Get random video from hentaihaven',
        group: CommandGroup.COMMUNITIES,
        aliases: [
            'haven',
            'hhaven'
        ],
        nsfw: true
    })
    private async exec(message: CommandMessage, query: RestAsString) {
        message.channel.startTyping();
        
        let results = await hentaihaven.search(query.get());
        if (!results.results.length) return message.reply('No search results found');

        const page = RandomUtils.randint(1, results.pages);
        if (page) results = await hentaihaven.search({
            search: query.get(),
            page: page
        });

        const video = RandomUtils.choice(results.results);
        new HentaiHavenEmbedBrowser(video).send_embed(message);
    }
    
    public async embed_handler(message: Message, client: Client, match: RegExpMatchArray) {
        const query = match[1].replace(/\s+/g, ' ');

        const results = await hentaihaven.search(query);

        if (!results.results.length) {
            message.reply(`Unable to fetch video ${query}`);
            return null;
        }

        const video_title = string_similarity.findBestMatch(query, results.results.map(video => video.title)).bestMatch.target;
        const video = results.results.find(video => video.title == video_title);

        return new HentaiHavenEmbedBrowser(video);
    }
}