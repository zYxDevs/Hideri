import { Discord, CommandMessage, Client } from '@typeit/discord';
import { get_prefix, server_configs } from '../server-config/ServerConfig';
import { Admin } from '../guards/Admin';
import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { GuardToBoolean } from '../guards/GuardToBoolean';
import { SetArgumentType } from '../argument-types/SetArgumentType';
import { DMChannel, GuildMember, Guild } from 'discord.js';
import { MessageEmbed } from '../utils/EmbedUtils';
import { server_config_vars, ServerConfig } from '../server-config/ServerConfigVars';
import { RestAsString } from '../argument-types/RestAsString';

class ConfigArgumentType extends SetArgumentType {
    public argument_list = ['help', 'get', 'set', 'delete'];
}

@Discord(get_prefix)
export abstract class AdminCommand {
    @Command('config', {
        group: CommandGroup.ADMIN,
        infos: 'sets server config',
        description: 'see \`config help\` for details',
        rest_required: false,
        example: 'config set common.prefix !\nconfig get common.prefix\nconfig delete common.prefix',
        history_expansion: false
    })
    private async config(message: CommandMessage, client: Client, action: ConfigArgumentType, config: string = null, value: RestAsString) {
        const dm_channel = message.channel instanceof DMChannel;
        let is_admin = dm_channel ? false : GuardToBoolean(Admin())([message], client);

        if (!dm_channel && !is_admin) return;

        if (action.get() == 'help' && !config) {
            const embed = new MessageEmbed({ title: 'Server Configuration' });

            Object.entries(server_config_vars).forEach(([ config, info ]) => {
                embed.addField(`\`${config}: ${info.type}\``, '```\n' + `${info.description}\nDefault: ${info.default_value}` + '\n```');
            });
            
            return message.channel.send(embed);
        } else if (action.get() == 'help') {
            if (!(config in server_config_vars)) return message.reply(`Error: unknown config property \`${config}\``);

            const config_info: ServerConfig = server_config_vars[config];

            const embed = new MessageEmbed({ title: `\`${config}\` configuration` });
            embed.addField('Description', config_info.description ?? 'None');
            embed.addField('Type', `\`${config_info.type}\``);
            if (config_info.allowed_values) embed.addField('Allowed Values', `\`${config_info.allowed_values}\``);
            embed.addField('Default Value', `\`${config_info.default_value}\``);
            if (!dm_channel) embed.addField('Current Value', `\`${server_configs[message.guild.id][config]}\``);

            return message.channel.send(embed);
        }

        let server_override: Guild = null;
        let value_final = value.get();

        if (!config) {
            return message.channel.send('Error: you must provide a config key (e.g. `common.prefix`)');
        }

        if (!(config in server_config_vars)) {
            return message.reply(`Error: unknown config property \`${config}\``);
        }

        if (dm_channel) {
            const server_id = value_final.match(/^\d{17,20}/)?.[0];
            if (!server_id) return message.channel.send('Error: you are calling this command from a DM channel and must provide a server id after the config key\nExample: \`<config get common.prefix 123456789101112\`');
            value_final = value_final.replace(/^\d{17,20}/, '').trim();

            const server = client.guilds.cache.get(server_id);
            if (!server) return message.channel.send(`Error: this bot is not connected to server id \`${server_id}\``);

            const member: GuildMember = await server.members.fetch(message.author.id).catch(() => null);
            if (!member) return message.channel.send(`Error: you are not in that server`);

            if (!member.hasPermission('ADMINISTRATOR')) return message.channel.send('Error: you are not an admin in that server');

            server_override = server;
        }

        if (action.get() == 'get') {
            const value = server_configs[server_override?.id ?? message?.guild?.id][config];
            return message.channel.send(`Config key \`${config}\` is currently set to \`${value}\``);
        }

        const config_type: ServerConfig = server_config_vars[config];

        if (action.get() == 'delete') {
            server_configs[server_override?.id ?? message?.guild?.id][config] = config_type.default_value;
            
            return message.channel.send(`Key \`${config}\` deleted`);
        }

        if (!value_final) return message.channel.send('Error: you need to provide a config value');

        let value_result;

        switch (config_type.type) {
            case 'boolean':
                if (/^true|t|1|yes|y$/i.test(value_final)) {
                    server_configs[server_override?.id ?? message?.guild?.id][config] = value_result = true;
                } else if (/^false|f|0|no|n$/i.test(value_final)) {
                    server_configs[server_override?.id ?? message?.guild?.id][config] = value_result = false;
                }

                break;
            case 'number':
                const n = parseFloat(value_final);
                if (!Number.isNaN(n)) server_configs[server_override?.id ?? message?.guild?.id][config] = value_result = n;

                break;
            case 'list':
                server_configs[server_override?.id ?? message?.guild?.id][config] = value_result = value_final.split(',').map(x => x.trim());

                break;

            default:
                server_configs[server_override?.id ?? message?.guild?.id][config] = value_result = value_final;
        }

        if (value_result === undefined) return message.channel.send(`Error: unable to set config key \`${config}\` to \`${value_final}\``);

        return message.channel.send(`Successfully set config key \`${config}\` to \`${value_result}\``);
    }
}
