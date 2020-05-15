import { MessageEmbed as DiscordMessageEmbed, MessageEmbedOptions } from 'discord.js';
import config from '../configs/config.json';

export abstract class EmbedUtils {
    public static create_image_embed(name: string, url?: string) {
        const embed = new MessageEmbed();
        embed.setAuthor(name, undefined, url);
        if (url) embed.setImage(url);
        return embed;
    }
}

export class MessageEmbed extends DiscordMessageEmbed {
    constructor(data?: DiscordMessageEmbed | MessageEmbedOptions) {
        super(data);
        if (!data.color) this.setColor(config.color);
    }
}