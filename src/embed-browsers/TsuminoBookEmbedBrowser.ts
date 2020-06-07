import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { EmbedBrowserOptions, BaseEmbedBrowser, EmbedReactionTypes } from './BaseEmbedBrowser';
import { Book } from '../apis/Tsumino';
import { tsumino } from '../apis/Instances';
import { MessageEmbed } from '../utils/EmbedUtils';
import plur from 'plur';

export class TsuminoBookEmbedBrowser extends PaginatedEmbedBrowser {
    public reaction_buttons = new Map([
        [EmbedReactionTypes.UP_SMALL, this.on_up],
        [EmbedReactionTypes.PREVIOUS, this.on_home],
        [EmbedReactionTypes.LEFT, this.on_previous],
        [EmbedReactionTypes.RIGHT, this.on_next],
        [EmbedReactionTypes.NEXT, this.on_end]
    ]);

    public min_page = 0;

    constructor(private book: Book, public _page: number = 0, options?: EmbedBrowserOptions) {
        super(_page, options);
        this.max_page = book.pages;
    }

    async get_embed() {
        if (this._page == 0) {
            const thumbnail_url = await tsumino.get_uploaded_or_proxied(this.book.thumbnail_url, { method: 'upload' });

            const embed = new MessageEmbed();
            embed.setImage(thumbnail_url);
            embed.setURL(this.book.url);
            embed.setTitle(this.book.title);
            if (this.book.uploaded) embed.addField('Uploaded On', this.book.uploaded, true);
            if (this.book.uploader.length) embed.addField('Uploaded By', this.book.uploader.join(', '), true);
            if (this.book.rating) embed.addField('Rating', this.book.rating, true);
            embed.addField('Number of Pages', this.book.pages);
            if (this.book.parody.length) embed.addField(plur('Parody', this.book.parody.length), this.book.parody.join(', '), true);
            if (this.book.category.length) embed.addField(plur('Category', this.book.category.length), this.book.category.join(', '), true);
            if (this.book.group.length) embed.addField(plur('Group', this.book.group.length), this.book.group.join(', '), true);
            if (this.book.tags.length) embed.addField('Tags', this.book.tags.join(', '));
            embed.setFooter('min 5 digits');

            return embed;
        } else {
            const page_url = await tsumino.get_uploaded_or_proxied(this.book.get_page_image_url(this._page), { method: 'upload' });

            const embed = new MessageEmbed();
            embed.setImage(page_url);
            embed.setURL(this.book.get_page_url(this._page));
            embed.setTitle(this.book.title);

            return embed;
        }
    }

    async on_home() {
        this.page = 1;
    }

    async on_end() {
        this.page = this.book.pages;
    }

    async on_up() {
        this.page = 0;
    }
}