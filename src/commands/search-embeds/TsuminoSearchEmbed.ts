import { BaseSearchEmbed } from './BaseSearchEmbed';
import { Client, Message } from 'discord.js';
import { CommandMessage, Discord } from '@typeit/discord';
import { CommandGroup } from '../../types/CommandGroup';
import { Command } from '../../ArgumentParser';
import { RestAsString } from '../../argument-types/RestAsString';
import { tsumino } from '../../apis/Instances';
import { RandomUtils } from '../../utils/RandomUtils';
import { get_prefix } from '../../server-config/ServerConfig';
import { TsuminoBookEmbedBrowser } from '../../embed-browsers/TsuminoBookEmbedBrowser';
import { Book } from '../../apis/Tsumino';
import { TsuminoVideoEmbedBrowser } from '../../embed-browsers/TsuminoVideoEmbedBrowser';

@Discord(get_prefix)
export class TsuminoSearchEmbed extends BaseSearchEmbed {
    public pattern = /\) *(\d{5,6}) *(\d{1,3})? *\(/g;

    public name = 'Tsumino';
    public info = 'Fetch video/doujin from tsumino';
    public usage = ')entry_id( or )entry_id page(';
    public nsfw = true;

    public use_webhook = false;
    public associated_command = 'ts';

    @Command('ts', {
        description: 'Get random doujin from tsumino',
        group: CommandGroup.COMMUNITIES,
        aliases: ['tsu', 'tsumino', 'tsgallery', 'tsbook', 'tsuminobook', 'tsuminogallery'],
        nsfw: true
    })
    private async book(message: CommandMessage, query: RestAsString) {
        message.channel.startTyping();
        
        let result = await tsumino.search<'Book'>(query.get(), 'Book');
        if (!result.data.length) return message.reply('No search results found');
        
        const page = RandomUtils.randint(1, result.pageCount);
        if (page != 1) result = await tsumino.search<'Book'>(query.get(), 'Book', {
            PageNumber: page
        });

        const entry = RandomUtils.choice(result.data);
        const book = await tsumino.get_entry<'Book'>(entry);

        return new TsuminoBookEmbedBrowser(book, RandomUtils.randint(1, book.pages)).send_embed(message);
    }

    @Command('tsv', {
        description: 'Get random video from tsumino',
        group: CommandGroup.COMMUNITIES,
        aliases: ['tsuminovideo', 'tsvideo'],
        nsfw: true
    })
    private async video(message: CommandMessage, query: RestAsString) {
        message.channel.startTyping();

        let result = await tsumino.search<'Video'>(query.get(), 'Video');
        if (!result.data.length) return message.reply('No search results found');
        
        const page = RandomUtils.randint(1, result.pageCount);
        if (page != 1) result = await tsumino.search<'Video'>(query.get(), 'Video', {
            PageNumber: page
        });

        const entry = RandomUtils.choice(result.data);
        const video = await tsumino.get_entry<'Video'>(entry);

        return new TsuminoVideoEmbedBrowser(video).send_embed(message);
    }

    public async embed_handler(message: Message, client: Client, match: RegExpMatchArray) {
        const entry_id = +match[1];
        const page_id = +match[2] || 0;
        
        const entry = await tsumino.get_entry(entry_id);

        if (!entry) {
            message.channel.send(`Unable to fetch entry ${entry_id}`);
            return null;
        }

        if (entry instanceof Book) return new TsuminoBookEmbedBrowser(entry, page_id);

        return new TsuminoVideoEmbedBrowser(entry);
    }
}