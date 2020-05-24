import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { EmbedBrowserOptions, EmbedReactionTypes } from './BaseEmbedBrowser';
import { EHGallery, GalleryToken, ThumbnailsType } from 'exapi';
import { exhentai } from '../apis/Instances';
import { MathUtils } from '../utils/MathUtils';
import { MessageEmbed } from '../utils/EmbedUtils';
import { create_logger } from '../utils/Logger';
import plur from 'plur';
import title from 'title';

const logger = create_logger(module);

export class ExHentaiEmbedBrowser extends PaginatedEmbedBrowser {
    public min_page = 0;
    public max_page;

    private images_per_page;

    public reaction_buttons = new Map([
        [EmbedReactionTypes.UP_SMALL, this.on_up],
        [EmbedReactionTypes.PREVIOUS, this.on_home],
        [EmbedReactionTypes.LEFT, this.on_previous],
        [EmbedReactionTypes.RIGHT, this.on_next],
        [EmbedReactionTypes.NEXT, this.on_end]
    ]);

    constructor(private gallery: EHGallery & { token: GalleryToken }, public _page: number = 0, options?: EmbedBrowserOptions) {
        super(_page, options);
        this.images_per_page = gallery.getViewHref().length;
        this.max_page = gallery.getInfo('length');
    }

    public static async from_gallery(gallery: GalleryToken, page: number = 0, options?: EmbedBrowserOptions) {
        const gallery_info = await exhentai.getGalleryInfo(gallery, ThumbnailsType.NORMAL);

        return new ExHentaiEmbedBrowser(gallery_info, MathUtils.clamp(page, 0, gallery_info.getInfo('length')));
    }

    async get_embed() {
        const is_ehentai = exhentai.isEHentai(this.gallery.token);

        if (Number.isInteger(this._page) && this._page > 0) {
            const view_segment = Math.floor((this._page - 1) / this.images_per_page) + 1;
            const current_segment = this.gallery._page;
            const advance_amount = view_segment - current_segment;
            const page_index = (this._page - 1) % this.images_per_page;

            if (advance_amount) {
                const advance_result = await this.gallery.next(advance_amount);
                if (advance_result == null) logger.warn(`page advance returned null`);
            }

            const page_token = this.gallery.getViewHref()[page_index];
            const image_url = exhentai.getImgUrl(page_token);
            
            const embed = new MessageEmbed();
            embed.setTitle(this.gallery.getInfo('title')[0]);
            embed.setURL(`https://e${await is_ehentai ? '-' : 'x'}hentai.org/s/${page_token[0]}/${page_token[1]}`);
            embed.setImage(await image_url);

            return embed;
        } else {
            const advance_amount = -(this.gallery._page - 1);
            
            if (advance_amount) {
                const advance_result = await this.gallery.next(advance_amount);
                if (advance_result == null) logger.warn('page advance returned null');
            }

            const page_token = this.gallery.getViewHref()[0];
            const image_url = exhentai.getImgUrl(page_token);

            const embed = new MessageEmbed();
            embed.setTitle(this.gallery.getInfo('title'));
            embed.setURL(`https://e${await is_ehentai ? '-' : 'x'}hentai.org/g/${this.gallery.token[0]}/${this.gallery.token[1]}`);
            embed.setImage(await image_url);
            embed.addField('Number of pages:', this.gallery.getInfo('length'));
            embed.addFields(Object.entries(this.gallery.getInfo('tag')).map(([ tag_name, tags ]) => {
                return {
                    name: ['male', 'female', 'misc'].includes(tag_name) ? title(tag_name) : title(plur(tag_name, 2)),
                    value: tags.join(', ')
                }
            }));

            return embed;
        }
    }

    async on_home() {
        this.page = 1;
    }

    async on_end() {
        this.page = this.gallery.getInfo('length');
    }

    async on_up() {
        this.page = 0;
    }
}