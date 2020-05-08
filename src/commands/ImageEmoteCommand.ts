import { Discord, CommandMessage } from '@typeit/discord';
import config from '../config.json';
import image_emotes from '../image_emotes.json';
import { Command } from '../ArgumentParser';
import { MessageEmbed } from 'discord.js';
import { CommandGroup } from '../types/CommandGroup';

@Discord({
    prefix: config.prefix
})
export abstract class ImageEmoteCommand {
    constructor() {
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
    }
}