import { Command } from '../ArgumentParser';
import { Discord, Guard, CommandMessage, Client } from '@typeit/discord';
import config from '../configs/config.json';
import { NotBot } from '../guards/NotBot';
import { Not } from '../guards/Not';
import { StartsWith } from '../guards/StartsWith';
import { NHentaiEmbedBrowser } from '../embed-browsers/NHentaiEmbedBrowser';
import { RestAsString } from '../argument-types/RestAsString';
import { RandomUtils } from '../utils/RandomUtils';
import { CommandGroup } from '../types/CommandGroup';
import { HasPermission } from '../guards/HasPermission';
import { TextChannel, Webhook } from 'discord.js';
import { EmbedBrowser } from '../embed-browsers/EmbedBrowser';
import { On } from '../events/On';

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
        const book = RandomUtils.choice<any>(books);
        if (!book) return message.reply('No search results found');
        const page = RandomUtils.randint(4, book.pages.length - 4);
        new NHentaiEmbedBrowser(book, page).send_embed(message);
    }

    @Guard(NotBot, Not(StartsWith('<')))
    @On('message')
    private async on_message(message: CommandMessage, client: Client) {
        message.channel.startTyping();
        const has_webhook_permission = HasPermission('MANAGE_WEBHOOKS', {
            error_message: null,
            check_admin: true
        })(message, client);

        let matches = [...message.content.matchAll(/\(\s*(\d{5,6})(\s+\d+)?\s*\)/g)];
        let webhook: Webhook;

        if (has_webhook_permission && message.channel instanceof TextChannel) {
            if (matches.length > 7) {
                const member = message.channel.members.find(member => member.user == client.user);
                webhook = await message.channel.createWebhook(member?.displayName ?? client.user.username, {
                    avatar: client.user.avatarURL()
                });
                matches = matches.slice(0, 100);
            }
        } else {
            matches = matches.slice(0, 8);
        }

        let embed_browsers: EmbedBrowser[] = [];

        for (let match_index = 0; match_index < matches.length; ++match_index) {
            const match = matches[match_index];
            const gallery = +match[1];
            const page = +match[2] || 0;
            
            const embed_browser: EmbedBrowser = (await (NHentaiEmbedBrowser.from_gallery(gallery, page).catch(() => {
                message.channel.send(`Unable to fetch gallery ${gallery}`);
                return null;
            })));

            if (webhook) {
                embed_browser && embed_browsers.push(embed_browser)

                if (embed_browsers.length >= 10 || match_index == (matches.length - 1)) {
                    const embeds = [];

                    for (const embed_browser of embed_browsers) {
                        embeds.push(await embed_browser.get_embed());
                        embed_browser.remove();
                    }
                    embed_browsers = [];
                    await webhook.send('', {
                        embeds: embeds
                    })
                }
            } else {
                await embed_browser?.send_embed(message);
            }
        }

        if (webhook) {
            webhook.delete();
        }
    }
}