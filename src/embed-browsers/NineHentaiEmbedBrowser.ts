import { EmbedBrowserOptions, EmbedReactionTypes } from './BaseEmbedBrowser';
import plur from 'plur';
import title from 'title';
import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { MessageEmbed } from '../utils/EmbedUtils';
import { NineHentaiBook, APITagType } from '9hentai';

export class NineHentaiEmbedBrowser extends PaginatedEmbedBrowser {
    public min_page = 0;
    public max_page;

    public reaction_buttons = new Map([
        [EmbedReactionTypes.UP_SMALL, this.on_up],
        [EmbedReactionTypes.PREVIOUS, this.on_home],
        [EmbedReactionTypes.LEFT, this.on_previous],
        [EmbedReactionTypes.RIGHT, this.on_next],
        [EmbedReactionTypes.NEXT, this.on_end]
    ]);

    constructor(private book: NineHentaiBook, public _page: number = 0, options?: EmbedBrowserOptions) {
        super(_page, options);
        this.max_page = book.page_count;
    }

    async get_embed() {
        if (this._page > 0) {
            const embed = new MessageEmbed();

            embed.setTitle(`/g/${this.book.id}/${this._page}`);
            embed.setURL(`https://9hentai.com/g/${this.book.id}/${this._page}/`);
            embed.setImage(this.book.pages[this._page - 1]);
            return embed;
        } else {
            const embed = new MessageEmbed();
            embed.setImage(this.book.cover);
            embed.setTitle(this.book.title ?? this.book.alt_title);
            embed.setURL(`https://9hentai.com/g/${this.book.id}/`);
            embed.setFooter('min 5 digits');
            embed.addField('Number of pages:', this.book.page_count, true);
            
            const tags: string[][] = [];

            this.book.tags.forEach(({ type, name }) => {
                if (!tags[type]) tags[type] = [];

                tags[type].push(name);
            });

            embed.addFields(tags.map((tags, type) => {
                const type_name = APITagType[type];
                if (!type_name) return;

                return {
                    name: title(plur(type_name, tags.length)),
                    value: tags.join(', '),
                    inline: type != APITagType.TAG
                };
            }).filter(x => x).reverse());

            return embed;
        }
    }

    async on_home() {
        this.page = 1;
    }

    async on_end() {
        this.page = this.book.page_count;
    }

    async on_up() {
        this.page = 0;
    }
}