import { Command } from '../ArgumentParser';
import { Discord, On, Guard, CommandMessage } from '@typeit/discord';
import config from '../config.json';
import { NotBot } from '../guards/NotBot';
import { Not } from '../guards/Not';
import { StartsWith } from '../guards/StartsWith';
import { NHentaiEmbedBrowser } from '../embed-browsers/NHentaiEmbedBrowser';
import { RestAsString } from '../argument-types/RestAsString';
import { RandomUtils } from '../utils/RandomUtils';
import { CommandGroup } from '../types/CommandGroup';

@Discord({
    prefix: config.prefix
})
export abstract class NHentaiCommand {
    @Command('nh', {
        description: 'Get random image from nhentai',
        group: CommandGroup.COMMUNITIES,
        aliases: ['nhentai']
    })
    private async execute(message: CommandMessage, query: RestAsString) {
        message.channel.startTyping();
        const query_str = encodeURIComponent(query.get());
        const { pages } = await NHentaiEmbedBrowser.api.search(query_str);
        const { books } = await NHentaiEmbedBrowser.api.search(query_str, RandomUtils.randint(1, pages));
        const book = RandomUtils.choice(books);
        if (!book) return message.reply('No search results found');
        const page = RandomUtils.randint(4, book.pages.length - 4);
        new NHentaiEmbedBrowser(book, page).send_embed(message);
    }

    @Guard(NotBot, Not(StartsWith('<')))
    @On('message')
    private async on_message(message: CommandMessage) {
        let match_number = 0;
        const matches = message.content.matchAll(/\(\s*(\d{5,6})\s*(\d+)?\s*\)/g);
        for (const match of matches) {
            const gallery = +match[1];
            const page = +match[2] || 0;
            
            (await (NHentaiEmbedBrowser.from_gallery(gallery, page).catch(() => {
                message.channel.send(`Unable to fetch gallery ${gallery}`);
                return null;
            })))?.send_embed(message);
            ++match_number;

            if (match_number > 7) break;
        }
    }
}