import { CommandMessage, Client, Discord, Guard } from '@typeit/discord';
import { get_prefix } from '../server-config/ServerConfig';
import { Command, KwArgs } from '../ArgumentParser';
import { RateLimit } from '../guards/RateLimit';
import { saucenao } from '../apis/Instances';
import { RestAsString } from '../argument-types/RestAsString';
import { StringUtils } from '../utils/StringUtils';
import { MessageUtils } from '../utils/MessageUtils';
import { SauceNAOEmbedBrowser } from '../embed-browsers/SauceNAOEmbedBrowser';
import { CommandGroup } from '../types/CommandGroup';

const sites: string[] = Object.setPrototypeOf({
    3: "DoujinMangaLexicon",
    4: "DoujinMangaLexicon",
    5: "Pixiv",
    6: "Pixiv",
    8: "NicoNicoSeiga",
    9: "Danbooru",
    10: "Drawr",
    11: "Nijie",
    12: "Yandere",
    13: "OpeningsMoe",
    16: "Fakku",
    18: "NHentai",
    19: "TwoDMarket",
    20: "MediBang",
    21: "AniDB",
    22: "AniDB",
    23: "IMDb",
    24: "IMDb",
    25: "Gelbooru",
    26: "Konachan",
    27: "SankakuChannel",
    28: "AnimePictures",
    29: "E621",
    30: "IdolComplex",
    31: "bcyIllust",
    32: "bcyCosplay",
    33: "PortalGraphics",
    34: "DeviantArt",
    35: "Pawoo",
    36: "MangaUpdates",
    'length': 37
}, Array.prototype).map(i => i);

@Discord(get_prefix)
export abstract class SauceNAOCommand {
    @Guard(RateLimit({
        scope: 'global',
        rate_limiters: [
            {
                limit: 7.5,
                scope: 'server'
            },
            {
                limit: 3600,
                amount: 8,
                scope: 'server'
            },
            {
                limit: 30,
                amount: 6
            }, {
                limit: 86400,
                amount: 200
            }
        ]
    }))
    @Command('sauce', {
        description: 'get sauce from SauceNAO',
        infos: 'get sauce',
        aliases: [
            'saucenao',
            'source',
            'saumnc',
            'sauc'
        ],
        kwargs: {
            database: [...new Set(Object.values(sites))].join('|')
        },
        history_expansion: false,
        rest_required: false,
        group: CommandGroup.COMMUNITIES
    })
    private async exec(message: CommandMessage, client: Client, kwargs: KwArgs, image: RestAsString) {
        const image_url = await MessageUtils.get_image(image.get(), message, client);
        if (!image_url) return message.reply(`Error: missing argument \`image\``);;

        message.channel.startTyping();

        const database_mask = kwargs?.database?.split(/[,|]/g).map(database => {
            const database_number = sites.indexOf(StringUtils.ci_get(sites, database));
            if (database_number !== -1) return database_number;
        }).filter(x => x);

        const options = database_mask && database_mask.length ? {
            mask: database_mask
        } : undefined;

        const results = await saucenao(image_url, options);

        if (!results?.length) return message.channel.send('No sauce found...');

        return new SauceNAOEmbedBrowser(results).send_embed(message);
    }
}