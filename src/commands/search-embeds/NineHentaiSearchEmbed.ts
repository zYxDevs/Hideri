import { BaseSearchEmbed } from './BaseSearchEmbed';
import { Client, Message } from 'discord.js';
import { CommandMessage, Discord } from '@typeit/discord';
import { CommandGroup } from '../../types/CommandGroup';
import { Command } from '../../ArgumentParser';
import { RestAsString } from '../../argument-types/RestAsString';
import { RandomUtils } from '../../utils/RandomUtils';
import { get_prefix } from '../../server-config/ServerConfig';
import { NineHentaiEmbedBrowser } from '../../embed-browsers/NineHentaiEmbedBrowser';
import { ninehentai } from '../../apis/Instances';

@Discord(get_prefix)
export class NineHentaiSearchEmbed extends BaseSearchEmbed {
    public pattern = /\[\s*(\d{5,6})(\s+\d+)?\s*\]/g;
    public use_webhook = false;

    public name = '9Hentai';
    public info = 'Fetch gallery from 9Hentai';
    public usage = '[gallery] or [gallery page]';
    public nsfw = true;

    public associated_command = '9h';

    @Command('9h', {
        description: 'Get random image from 9hentai',
        group: CommandGroup.COMMUNITIES,
        aliases: ['9hentai', 'ninehentai'],
        nsfw: true
    })
    private async exec(message: CommandMessage, query: RestAsString) {
        message.channel.startTyping();

        let result = await ninehentai.search(query.get());

        if (!result.results.length) return message.reply('No search results found');
        
        const page = RandomUtils.randint(0, result.pages - 1);
        if (page) result = await ninehentai.search(query.get(), { page: page });

        const book = RandomUtils.choice(result.results);

        return new NineHentaiEmbedBrowser(book).send_embed(message);
    }

    public async embed_handler(message: Message, client: Client, match: RegExpMatchArray) {
        const gallery = +match[1];
        const page = +match[2] || 0;

        const book = await ninehentai.get_book(gallery);

        if (!book) {
            message.channel.send(`Unable to fetch gallery ${gallery}`);
            return null;
        }

        return new NineHentaiEmbedBrowser(book, page);
    }
}