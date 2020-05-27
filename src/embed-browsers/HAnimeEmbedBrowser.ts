import { EmbedBrowserOptions, BaseEmbedBrowser } from './BaseEmbedBrowser';
import { MessageEmbed } from '../utils/EmbedUtils';
import { HAnimeVideo } from 'hanime';
import moment from 'moment-timezone'

export class HAnimeEmbedBrowser extends BaseEmbedBrowser {
    constructor(private video: HAnimeVideo, options?: EmbedBrowserOptions) {
        super(options);
    }

    async get_embed() {
        const embed = new MessageEmbed();
        embed.setImage(this.video.cover_url ?? this.video.poster_url);
        embed.setTitle(this.video.name);
        embed.setURL(this.video.video_url);
        embed.addField(this.video.data.hentai_video.is_censored ? 'Censored' : 'Uncensored', `**${this.video.views.toLocaleString()} views**\n${this.video.likes.toLocaleString()} likes | ${this.video.dislikes.toLocaleString()} dislikes`, true);
        embed.addField('Brand', this.video.brand, true);
        embed.addField('Brand Uploads', this.video.data.brand.count, true);
        embed.addField('Release Date', moment(this.video.released_at).format('MMMM Do, YYYY'), true);
        embed.addField('Upload Date', moment(this.video.created_at).format('MMMM Do, YYYY'), true);
        embed.addField('Alternate Titles', this.video.titles.map(({ title }) => title).join(', '), true);
        embed.addField('Tags', this.video.tags.map(({ text }) => text).join(', '));

        return embed;
    }
}