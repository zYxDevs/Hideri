import { EmbedBrowserOptions, EmbedReactionTypes } from './BaseEmbedBrowser';
import { Message } from 'discord.js';
import { hitomi } from '../apis/Instances';
import { MathUtils } from '../utils/MathUtils';
import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { GalleryInfo } from '../apis/Hitomi';
import fetch from 'node-fetch';
import { MessageEmbed } from '../utils/EmbedUtils';
import config from '../configs/config.json';

export class HitomiEmbedBrowser extends PaginatedEmbedBrowser {
    public min_page = 0;
    public max_page;

    private last_embed: MessageEmbed;

    private fetch_order: number[];

    public reaction_buttons = new Map([
        [EmbedReactionTypes.UP_SMALL, this.on_up],
        [EmbedReactionTypes.PREVIOUS, this.on_home],
        [EmbedReactionTypes.LEFT, this.on_previous],
        [EmbedReactionTypes.RIGHT, this.on_next],
        [EmbedReactionTypes.NEXT, this.on_end]
    ]);

    constructor(private gallery: GalleryInfo, public _page: number = 0, options?: EmbedBrowserOptions) {
        super(_page, options);
        this.max_page = gallery.files.length;

        this.fetch_order = [...new Array(gallery.files.length).keys()].sort((a, b) => Math.abs(a - _page + 1) - Math.abs(b - _page + 1));
    }

    public static async from_gallery(gallery_id: number, page?: number, options?: EmbedBrowserOptions) {
        const gallery = await hitomi.get_gallery_info(gallery_id);

        return new HitomiEmbedBrowser(gallery, page, options);
    }

    public send_embed(message: Message) {
        this.fetch_image();
        return super.send_embed(message);
    }

    private async fetch_image() {
        if (!this.fetch_order.length) return;

        const image = this.gallery.files[this.fetch_order.shift()];
        const url = hitomi.get_image_url(image).replace(config.server_url, `http://localhost:${config.port}`);

        await fetch(url);

        setTimeout(() => {
            this.fetch_image();
        }, 1000);
    }

    async get_embed() {
        if (this.last_embed) {
            this.last_embed.setImage('https://cdn.discordapp.com/attachments/473310675616268292/710249110023831623/loading.png');
            this.message.edit(this.last_embed);
        }

        if (Number.isInteger(this._page) && this._page > 0) {
            const embed = new MessageEmbed();
            this._page = MathUtils.clamp(this._page, 1, this.gallery.files.length);
            embed.setTitle(this.gallery.title);
            embed.setURL(hitomi.get_gallery_url(this.gallery));
            const image = hitomi.get_image_url(this.gallery.files[this._page - 1]);
            await fetch(image);
            embed.setImage(image);
            this.last_embed = embed;
            return embed;
        } else {
            const embed = new MessageEmbed();
            embed.setTitle(this.gallery.title);
            const image = hitomi.get_image_url(this.gallery.files[0]);
            await fetch(image);
            embed.setImage(image);
            embed.setURL(hitomi.get_gallery_url(this.gallery));
            embed.setFooter('min 5 digits');
            embed.addField('Number of pages:', this.gallery.files.length);
            let language = this.gallery.language_localname;
            if (this.gallery.language_localname != this.gallery.language) language += ` (${this.gallery.language})`;
            if (this.gallery.language_localname) embed.addField('Language:', language);
            embed.addField('Type:', this.gallery.type);

            const tags = this.gallery.tags.map(tag => {
                let out = tag.tag;
                if (tag.male) out += ' (\\\u2642)';
                if (tag.female) out += ' (\\\u2640)';
                return out;
            });

            embed.addField('Tags:', tags.join(', '));
            this.last_embed = embed;
            return embed;
        }
    }

    async on_home() {
        this.page = 1;
    }

    async on_end() {
        this.page = this.gallery.files.length;
    }

    async on_up() {
        this.page = 0;
    }
}