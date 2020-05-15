import { Discord, CommandMessage } from '@typeit/discord';
import config from '../configs/config.json';
import image_emotes from '../configs/image_emotes.json';
import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { MessageEmbed } from '../utils/EmbedUtils';

image_emotes.forEach(({ name, info, description, url }) => {
    @Discord({
        prefix: config.prefix
    })
    class ImageEmote {
        @Command(name, {
            infos: info,
            description: description,
            group: CommandGroup.IMAGE_EMOTES
        })
        private async exec(message: CommandMessage) {
            const embed = new MessageEmbed();
            embed.setImage(url);
            message.channel.send(embed);
        }
    }
});