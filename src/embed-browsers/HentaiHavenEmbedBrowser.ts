import { BaseEmbedBrowser, EmbedBrowserOptions } from './BaseEmbedBrowser';
import { MessageEmbed } from '../utils/EmbedUtils';
import { HentaiHavenVideo } from 'hentaihaven';
import { hentaihaven } from '../apis/Instances';
import moment from 'moment-timezone';

export class HentaiHavenEmbedBrowser extends BaseEmbedBrowser {
    constructor(private video: HentaiHavenVideo, options?: EmbedBrowserOptions) {
        super(options);
    }
    
    async get_embed() {
        const embed = new MessageEmbed();

        const image = await hentaihaven.get_video_image(this.video);
        const series = await hentaihaven.get_video_series(this.video);

        if (image) embed.setImage(image.source_url);
        if (series) embed.setDescription(series.description);

        embed.setTitle(this.video.title);
        embed.setURL(this.video.link);
        embed.addField('Date Aired', moment(this.video.date_aired).format('Do MMM., YYYY'), true);
        embed.addField('Tags', this.video.tags.map(({ name }) => name).join(', '));

        return embed;
    }
}