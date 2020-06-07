import { BaseEmbedBrowser, EmbedBrowserOptions, EmbedReactionTypes } from './BaseEmbedBrowser';
import { MathUtils } from '../utils/MathUtils';
import { Message, PartialTextBasedChannelFields } from 'discord.js';

export abstract class PaginatedEmbedBrowser extends BaseEmbedBrowser {
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
        const last_page = this._page;
        this._page = MathUtils.clamp(page, this.min_page, this.max_page);

        if (this._page != last_page) this.get_embed(this.message).then(embed => this.set_embed(embed));
    }

    public async send_embed(message: Message, send_override?: PartialTextBasedChannelFields['send']) {
        this._page = MathUtils.clamp(this._page, this.min_page, this.max_page);
        return super.send_embed(message, send_override);
    }

    public on_previous() {
        --this.page;
    }

    public on_next() {
        ++this.page;
    }
}