import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { MessageEmbed } from '../utils/EmbedUtils';
import { SagiriResult } from 'sagiri';
import { EmbedBrowserOptions } from './BaseEmbedBrowser';

export class SauceNAOEmbedBrowser extends PaginatedEmbedBrowser {
    private has_low_similarity = false;
    
    constructor(private sources: SagiriResult[], options?: EmbedBrowserOptions) {
        super(1, options);
        const low_similarity_index = sources.findIndex(({ similarity }) => similarity < 50);
        if (low_similarity_index != -1) {
            sources.splice(low_similarity_index, 0, null);
            this.has_low_similarity = true;
        }

        this.max_page = sources.length;
    }
    
    async get_embed() {
        if (!this.sources.length) return new MessageEmbed({
            title: 'No Results Found',
            description: 'No results were found for that image. Try searching manually on Google Images/Tineye'
        });

        const source = this.sources[this._page - 1];

        if (source === null) return new MessageEmbed({
            title: 'Low Similarity Results Hidden',
            description: 'Click the next arrow to see hidden results'
        });

        const raw_data = source.raw.data as any;
        const title =
            raw_data.eng_name ??
            raw_data.jp_name ??
            raw_data.title ??
            raw_data.source ??
            raw_data.material ??
            source.authorName ??
            source.authorUrl ??
            source.url;
        
        const author =
            source.authorName ??
            raw_data.member_name ??
            raw_data.creator?.join?.(', ') ??
            raw_data.creator ??
            raw_data.author_name ??
            source.authorUrl ??
            raw_data.author_url ??
            source.site;

        const author_url = source.authorUrl ?? raw_data.author_url;
        
        const embed = new MessageEmbed();

        embed.setTitle(title);
        source.url && embed.setURL(source.url);
        source.thumbnail && embed.setImage(source.thumbnail.replace(/ /g, '%20'));
        embed.addField('Author', author_url ? `[${author}](${author_url})` : author);
        embed.addField('Similarity', source.similarity);
        embed.addField('Site', source.site);
        embed.setFooter(`result ${this._page - +(source.similarity < 50)} of ${this.sources.length - +this.has_low_similarity}`);

        return embed;
    }
}