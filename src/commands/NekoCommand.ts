import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { CommandMessage, Discord } from '@typeit/discord';
import { SetArgumentType } from '../argument-types/SetArgumentType';
import neko_tags from '../configs/neko_tags.json';
import { RestAsString } from '../argument-types/RestAsString';
import { StringUtils } from '../utils/StringUtils';
import config from '../configs/config.json';
import { nekos } from '../apis/Instances';
import { MessageEmbed } from '../utils/EmbedUtils';
import { GuildMember, DMChannel } from 'discord.js';
import { get_prefix, server_configs } from '../server-config/ServerConfig';
import title from 'title';
import plur from 'plur';

class NekosArgumentType extends SetArgumentType {
    public default = 'neko';
    public optional = true;
    public argument_list = [...neko_tags, 'OwOify', 'spoiler'];
}

@Discord(get_prefix)
export abstract class NekoCommand {
    constructor() {
        ['tickle', 'slap', 'poke', 'kiss', 'hug', 'feed', 'cuddle'].forEach(command => {
            @Discord(get_prefix)
            class GenericNekoCommand {
                @Command(command, {
                    infos: `${title(command)} someone`,
                    group: CommandGroup.IMAGE_EMOTES
                })
                private async exec(message: CommandMessage, member: GuildMember = null) {
                    const embed = new MessageEmbed();
                    embed.setImage((await nekos.sfw[command]()).url);
                    if (member) embed.setDescription(`*${title(plur(command, 2))} ${member}*`);
            
                    message.channel.send(embed);
                }
            }
        });
    }

    @Command('neko', {
        infos: 'Fetch image from nekos.life',
        group: CommandGroup.COMMUNITIES,
        rest_required: false
    })
    private async neko(message: CommandMessage, tag_type: NekosArgumentType, text: RestAsString) {
        const tag = tag_type.get();
        if (StringUtils.ci_includes(neko_tags, tag)) {
            let location = 'sfw'
            if (StringUtils.ci_get(nekos.nsfw, tag)) {
                if (!(message.channel instanceof DMChannel) &&
                    !message.channel.nsfw &&
                    !server_configs[message?.guild?.id]['common.nsfw_all_channels']) {
                    return message.react('💢');
                }

                message.channel.startTyping();
                location = 'nsfw';
            } else {
                message.channel.startTyping();
            }
            const response = await StringUtils.ci_get(nekos[location], tag)();
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
            const response = await StringUtils.ci_get(nekos.sfw, tag)({ text: text_str });
            message.channel.send(response.msg || response.owo);
        }
    }

    @Command('pat', {
        infos: 'Heatpat someone',
        group: CommandGroup.IMAGE_EMOTES,
        aliases: [ 'headpat' ]
    })
    private async pat(message: CommandMessage, member: GuildMember = null) {
        const embed = new MessageEmbed();
        embed.setImage((await nekos.sfw.pat()).url);
        if (member) embed.setDescription(`*Pats ${member}*`);

        message.channel.send(embed);
    }
}