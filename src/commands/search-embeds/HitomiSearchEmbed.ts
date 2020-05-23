import { BaseSearchEmbed } from './BaseSearchEmbed';
import { CommandMessage, Discord, Guard } from '@typeit/discord';
import { Client, Message } from 'discord.js';
import config from '../../configs/config.json';
import { Command } from '../../ArgumentParser';
import { CommandGroup } from '../../types/CommandGroup';
import { hitomi } from '../../apis/Instances';
import { RandomUtils } from '../../utils/RandomUtils';
import { HitomiEmbedBrowser } from '../../embed-browsers/HitomiEmbedBrowser';
import { BaseEmbedBrowser } from '../../embed-browsers/BaseEmbedBrowser';
import { RateLimit } from '../../guards/RateLimit';
import { get_prefix } from '../../server-config/ServerConfig';

@Discord(get_prefix)
export class HitomiSearchEmbed extends BaseSearchEmbed {
    public pattern = /!\s*(\d{5,7})(\s+\d+)?\s*!/g;
    public use_webhook = false;

    public name = 'Hitomi.la';
    public info = 'Fetch gallery from hitomi.la';
    public usage = '!gallery! or !gallery page!';
    public nsfw = true;

    @Guard(RateLimit({
        scope: 'server',
        rate_limit: 1
    }))
    @Command('hitomi', {
        group: CommandGroup.COMMUNITIES,
        description: 'Get random image from hitomi.la',
        aliases: [ 'hitomila' ],
        nsfw: true
    })
    private async exec(message: CommandMessage, ...query: string[]) {
        const reply = message.channel.send('Searching...');
        message.channel.startTyping();
        const result = await hitomi.search(...query);
        if (!result.length) return (await reply).edit('No search results found');
        const gallery_number = RandomUtils.choice(result);

        const gallery = await hitomi.get_gallery_info(gallery_number);

        const page = RandomUtils.randint(1, gallery.files.length);

        (await reply).delete();
        new HitomiEmbedBrowser(gallery, page).send_embed(message);
    }

    public async embed_handler(message: Message, client: Client, match: RegExpMatchArray) {
        const gallery = +match[1];
        const page = +match[2] || 0;

        const embed_browser: BaseEmbedBrowser = (await (HitomiEmbedBrowser.from_gallery(gallery, page).catch(() => {
            message.channel.send(`Unable to fetch gallery ${gallery}`);
            return null;
        })));

        return embed_browser;
    }
}