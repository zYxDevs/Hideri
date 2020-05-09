import { MessageEmbed } from 'discord.js';

export abstract class EmbedUtils {
    public static create_image_embed(name: string, url?: string) {
        const embed = new MessageEmbed();
        embed.setAuthor(name, undefined, url);
        if (url) embed.setImage(url);
        return embed;
    }
}