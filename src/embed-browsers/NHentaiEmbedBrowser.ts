import { EmbedBrowserOptions, EmbedReactionTypes } from './BaseEmbedBrowser';
import { nhentai } from '../apis/Instances';
import { MathUtils } from '../utils/MathUtils';
import plur from 'plur';
import title from 'title';
import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { Book } from 'nhentai-api';
import { MessageEmbed } from '../utils/EmbedUtils';

export class NHentaiEmbedBrowser extends PaginatedEmbedBrowser {
    private doujin: Book;
    private gallery: number;

    public min_page = 0;
    public max_page;

    public reaction_buttons = new Map([
        [EmbedReactionTypes.UP_SMALL, this.on_up],
        [EmbedReactionTypes.PREVIOUS, this.on_home],
        [EmbedReactionTypes.LEFT, this.on_previous],
        [EmbedReactionTypes.RIGHT, this.on_next],
        [EmbedReactionTypes.NEXT, this.on_end]
    ]);

    constructor(private book, public _page: number = 0, options?: EmbedBrowserOptions) {
        super(_page, options);
        this.doujin = book;
        this.max_page = book.pages.length;
        this.gallery = book.id;
    }

    public static async from_gallery(gallery: number, page: number = 0, options?: EmbedBrowserOptions) {
        return new NHentaiEmbedBrowser(await nhentai.getBook(gallery), page, options);        
    }

    async get_embed() {
        if (Number.isInteger(this._page) && this._page > 0) {
            const embed = new MessageEmbed();
            this._page = MathUtils.clamp(this._page, 1, this.doujin.pages.length);
            embed.setTitle(`/g/${this.gallery}/${this._page}`);
            embed.setURL(`https://nhentai.net/g/${this.gallery}/${this._page}/`);
            embed.setImage(nhentai.getImageURL(this.doujin.pages[this._page - 1]));
            return embed;
        } else {
            const embed = new MessageEmbed();
            embed.setImage(nhentai.getImageURL(this.doujin.cover));
            embed.setTitle(this.doujin.title.english ?? this.doujin.title.japanese ?? this.doujin.title.pretty);
            embed.setURL(`https://nhentai.net/g/${this.gallery}/`);
            embed.setFooter('min 5 digits');
            embed.addField('Number of pages:', this.doujin.pages.length);
            const tag_dict: { [key: string]: string[] } = {};
            (this.doujin as any).tags.forEach(tag => {
                const type = tag.type.type;
                if (!(type in tag_dict)) tag_dict[type] = [];
                tag_dict[type].push(tag.name)
            });
            embed.addFields(Object.entries(tag_dict).map(([ type, tags ]) => ({
                name: title(plur(type, tags.length)) + ':',
                value: tags.join(', ')
            })));
            return embed;
        }
    }

    async on_home() {
        this.page = 1;
    }

    async on_end() {
        this.page = this.doujin.pages.length;
    }

    async on_up() {
        this.page = 0;
    }
}