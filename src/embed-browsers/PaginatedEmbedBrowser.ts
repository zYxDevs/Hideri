import { EmbedBrowser, EmbedBrowserOptions, EmbedReactionTypes } from './EmbedBrowser';
import { MathUtils } from '../utils/MathUtils';

export abstract class PaginatedEmbedBrowser extends EmbedBrowser {
    public min_page = 1;
    public max_page = 2;

    public reaction_buttons = new Map([
        [EmbedReactionTypes.LEFT, this.on_previous],
        [EmbedReactionTypes.RIGHT, this.on_next],
    ]);

    constructor(public _page: number = 0, options?: EmbedBrowserOptions) { super(options) }

    get page() {
        return this._page;
    }

    set page(page: number) {
        this._page = MathUtils.clamp(page, this.min_page, this.max_page);
        this.get_embed().then(embed => this.set_embed(embed));
    }

    public on_previous() {
        --this.page;
    }

    public on_next() {
        ++this.page;
    }
}