import NekosClient from 'nekos.life';
import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { CommandMessage, Discord } from '@typeit/discord';
import { SetArgumentType } from '../argument-types/SetArgumentType';
import neko_tags from '../neko_tags.json';
import { RestAsString } from '../argument-types/RestAsString';
import { StringUtils } from '../utils/StringUtils';
import { MessageEmbed } from 'discord.js';
import config from '../config.json';

class NekosArgumentType extends SetArgumentType {
    public argument_list = [...neko_tags, 'OwOify', 'spoiler'];
}

@Discord({
    prefix: config.prefix
})
export abstract class NekoCommand {
    private nekos_client = new NekosClient();

    @Command('neko', {
        infos: 'Fetch image from nekos.life',
        group: CommandGroup.COMMUNITIES,
        rest_required: false
    })
    private async neko(message: CommandMessage, tag_type: NekosArgumentType, text: RestAsString) {
        const tag = tag_type.get();
        if (StringUtils.ci_includes(neko_tags, tag)) {
            message.channel.startTyping();
            let location = 'sfw'
            if (StringUtils.ci_get(this.nekos_client.nsfw, tag)) location = 'nsfw';
            const response = await StringUtils.ci_get(this.nekos_client[location], tag)();
            if (!response.url) return message.channel.send(response.cat ?? response.why ?? response.owo ?? response.fact ?? response.msg);
            const embed = new MessageEmbed();
            embed.setImage(response.url);
            if (!response.response) {
                embed.setAuthor('Nekos Result', undefined, response.url);
            } else {
                embed.addField('8Ball Says:', response.response, true);
            }
            message.channel.send(embed);
        } else {
            let text_str = text.get().trim();
            if (!text_str) return message.reply(`Error: missing argument \`text\``);
            message.channel.startTyping();
            const response = await StringUtils.ci_get(this.nekos_client.sfw, tag)({ text: text_str });
            message.channel.send(response.msg || response.owo);
        }
    }
}