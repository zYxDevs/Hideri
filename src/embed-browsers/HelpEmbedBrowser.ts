import { EmbedBrowserOptions } from './BaseEmbedBrowser';
import { PaginatedEmbedBrowser } from './PaginatedEmbedBrowser';
import { Client } from '@typeit/discord';
import { CommandGroup } from '../types/CommandGroup';
import config from '../configs/config.json';
import { DOnExt } from '../types/DOnExt';
import { MessageEmbed } from '../utils/EmbedUtils';
import { BaseSearchEmbed } from '../commands/search-embeds/BaseSearchEmbed';
import { AppDiscord } from '../AppDiscord';

export class HelpEmbedBrowser extends PaginatedEmbedBrowser {
    private page_length = 7;

    private commands: DOnExt[] = [...new Array(BaseSearchEmbed.class_instances.length), ...Client.getCommandsIntrospection().reduce((command_map, command: DOnExt) => {
        if (command.hide) return command_map;

        if (!command_map.has(command.group)) command_map.set(command.group, []);
        command_map.get(command.group).push(command);

        return command_map;
    }, new Map<CommandGroup, DOnExt[]>()).values()].flat();
    public max_page = Math.ceil(this.commands.length / this.page_length);
    
    constructor(options?: EmbedBrowserOptions) {
        super(1, options);
    }

    async get_embed() {
        const command_segment = this.commands.slice((this.page - 1) * this.page_length, this.page * this.page_length);
        const embed = new MessageEmbed({ title: 'Command Help' });
        embed.setFooter(`Page ${this.page}/${this.max_page}`);

        if (this.page == 1) {
            embed.setThumbnail(AppDiscord.client.user.avatarURL());

            embed.addField('*Tip: use \`!!\` in command arguments to refer to the content of the last message in the channel*', '**Search Embeds**');
            BaseSearchEmbed.class_instances.forEach(instance => {
                embed.addField(`${instance.name}: ${instance.info ?? ''}`, `${instance.description ?? ''}\nUsage: \`${instance.usage}\``);
            });
        }

        command_segment.forEach((command, index) => {
            if (!command) return;
            const previous_command = command_segment[index - 1];
            if (!previous_command || previous_command.group != command.group) embed.addField('\ufeff', `**${command.group}**`);
            embed.addField(`\`${config.prefix}${command.commandName}\`: ${command.infos ?? ''}`, `${command.description ?? ''}\nUsage: \`${command.usage}\``);
        });

        return embed;
    }
}
