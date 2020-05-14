import { EmbedBrowserOptions } from './BaseEmbedBrowser';
import { MessageEmbed } from 'discord.js';
import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { Client } from '@typeit/discord';
import { CommandGroup } from '../types/CommandGroup';
import config from '../configs/config.json';
import { IOnExt } from '../types/IOnExt';

export class HelpEmbedBrowser extends PaginatedEmbedBrowser {
    private page_length = 7;

    private commands: IOnExt[] = [...Client.getCommandsIntrospection().reduce((command_map, command: IOnExt) => {
        if (command.hide) return command_map;

        if (!command_map.has(command.group)) command_map.set(command.group, []);
        command_map.get(command.group).push(command);

        return command_map;
    }, new Map<CommandGroup, IOnExt[]>()).values()].flat();
    public max_page = Math.ceil(this.commands.length / this.page_length);
    
    constructor(options?: EmbedBrowserOptions) {
        super(1, options);
    }

    async get_embed() {
        const command_segment = this.commands.slice((this.page - 1) * this.page_length, this.page * this.page_length);
        const embed = new MessageEmbed({ title: 'Command Help' });
        embed.setFooter(`Page ${this.page}/${this.max_page}`);
        command_segment.forEach((command, index) => {
            const previous_command = command_segment[index - 1];
            if (!previous_command || previous_command.group != command.group) embed.addField('\ufeff', `**${command.group}**`);
            embed.addField(`\`${config.prefix}${command.commandName}\`: ${command.infos ?? ''}`, `${command.description ?? ''}\nUsage: \`${command.usage}\``);
        });

        return embed;
    }
}
