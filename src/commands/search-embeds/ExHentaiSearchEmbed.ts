import { BaseSearchEmbed } from './BaseSearchEmbed';
import { Client, Message } from 'discord.js';
import { CommandMessage, Discord, Guard } from '@typeit/discord';
import { BaseEmbedBrowser } from '../../embed-browsers/BaseEmbedBrowser';
import { NHentaiEmbedBrowser } from '../../embed-browsers/NHentaiEmbedBrowser';
import config from '../../configs/config.json';
import { CommandGroup } from '../../types/CommandGroup';
import { Command, KwArgs } from '../../ArgumentParser';
import { RestAsString } from '../../argument-types/RestAsString';
import { nhentai, exhentai } from '../../apis/Instances';
import { RandomUtils } from '../../utils/RandomUtils';
import { get_prefix } from '../../server-config/ServerConfig';
import { ExHentaiEmbedBrowser } from '../../embed-browsers/ExHentaiEmbedBrowser';
import { StringUtils } from '../../utils/StringUtils';
import { ThumbnailsType } from 'exapi';
import { RateLimit } from '../../guards/RateLimit';

@Discord(get_prefix)
export class ExHentaiSearchEmbed extends BaseSearchEmbed {
    public pattern = /}\s*(\d{1,7})\/([\da-z]{10})(?:\/(\d+))?\s*{/g;

    public name = 'Exhentai';
    public info = 'Fetch gallery from exhentai/e-hentai';
    public usage = '}gallery/token{ or }gallery/token/page{';
    public nsfw = true;
    public use_webhook = false;

    private types = {
        'doujinshi': 'Doujinshi',
        'manga': 'Manga',
        'artist_cg': 'Artist CG',
        'game_cg': 'Game CG',
        'western': 'Western',
        'non_h': 'Non-H',
        'image_set': 'Image Set',
        'cosplay': 'Cosplay',
        'asian_porn': 'Asian Porn',
        'misc': 'Misc'
    };

    @Guard(RateLimit({
        scope: 'server',
        rate_limit: 1.5
    }))
    @Command('eh', {
        description: 'Get random image from exhentai/e-hentai',
        group: CommandGroup.COMMUNITIES,
        aliases: ['ex', 'exhentai', 'e-hentai', 'ehentai'],
        nsfw: true,
        kwargs: {
            'type': 'Array<doujinshi,manga,artist_cg,game_cg,western,non_h,image_set,cosplay,asian_porn,misc>'
        },
        example: `<ehentai mindbreak\n<eh futanari --type=doujinshi\n<ex trap catboy --type=doujinshi,manga`
    })
    private async exec(message: CommandMessage, kwargs: KwArgs, query: RestAsString) {
        message.channel.startTyping();
        const reply = message.channel.send('Searching...');

        const query_str = encodeURIComponent(query.get());

        const search_results = await exhentai.search({
            text: query_str,
            type: kwargs.type ? kwargs.type.split(',').map(type => {
                return StringUtils.ci_get(this.types, type)
            }).filter(x => x) : Object.values(this.types)
        });

        if (!search_results.pages) return message.reply('No search results found'); 

        const advance = RandomUtils.randint(0, search_results.pages - 1);
        if (advance) await search_results.next(advance);

        const token = RandomUtils.choice(search_results.getAll()).href;

        const gallery = await exhentai.getGalleryInfo(token, ThumbnailsType.NORMAL);
        const page = RandomUtils.randint(1, gallery.getInfo('length'));

        (await reply).delete();

        new ExHentaiEmbedBrowser(gallery, page).send_embed(message);
    }

    public async embed_handler(message: Message, client: Client, match: RegExpMatchArray) {
        const gallery = match[1];
        const token = match[2]
        const page = +match[3] || 0;

        const embed_browser: BaseEmbedBrowser = (await (ExHentaiEmbedBrowser.from_gallery([gallery, token], page).catch(() => {
            message.channel.send(`Unable to fetch gallery ${gallery}/${token}`);
            return null;
        })));

        return embed_browser;
    }
}