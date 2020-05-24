import 'reflect-metadata';
import get_function_arguments from 'get-function-arguments';
import { Command as DiscordCommand, CommandMessage, Client } from '@typeit/discord';
import string_argv from 'string-argv';
import config from './configs/config.json';
import { CustomArgumentType } from './argument-types/CustomArgumentType.js';
import { RestAsString } from './argument-types/RestAsString.js';
import { Integer } from './argument-types/Integer.js';
import { CommandGroup } from './types/CommandGroup';
import { User, GuildMember, DMChannel } from 'discord.js';
import { create_logger } from './utils/Logger';
import fs from 'fs';
import path from 'path';
import logging from './configs/logging.json';
import { DOnExt } from './types/DOnExt';
import { get_prefix_str, server_configs } from './server-config/ServerConfig';
import matcher from 'matcher';

const writeFile = fs.promises.writeFile;

const logger = create_logger(module);

const write_error = (commandName: string, error: Error) => {
    const filename = path.join(__dirname, logging.log_dir, `error-${Date.now()}.stacktrace`);
    logger.error(`command ${commandName} errored: ${error.stack}`);
    logger.error(`full stacktrace has been written to ${filename}`);
    writeFile(filename, error.stack);
};

const default_options = {
    group: CommandGroup.GENERAL,
    args_required: true,
    incorrect_usage_message: true,
    missing_argument_message: true,
    extraneous_argument_message: true,
    handle_errors: true,
    usage: null,
    rest_required: true,
    history_expansion: true,
    nsfw: false,
    aliases: []
};

const reply_incorrect = (options, name: string, usage: string, message: CommandMessage) => {
    let output = '';
    if (options.missing_argument_message) output += `Error: incorrect argument \`${name}\`\n\n`;
    if (options.incorrect_usage_message) output += `Usage: \`${usage}\``;
    if (output) message.reply(output);
}

export interface CommandParamsExt {
    infos?: string,
    description?: string,
    group?: CommandGroup,
    usage?: string,
    hide?: boolean,
    aliases?: string[],
    args_required?: boolean,
    incorrect_usage_message?: boolean,
    missing_argument_message?: boolean,
    extraneous_argument_message?: boolean,
    handle_errors?: boolean,
    rest_required?: boolean,
    history_expansion?: boolean,
    nsfw?: boolean,
    example?: string
};

const commands: DOnExt[] = [];

export abstract class CommandMetadataStorage {
    public static get_commands(): DOnExt[] {
        return commands;
    }
}

export function Command(commandName: string, params: CommandParamsExt = default_options) {
    logger.debug(`command ${commandName} created in group ${params.group}`);
    params = Object.assign({}, default_options, params);
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const argument_types = Reflect.getMetadata('design:paramtypes', target, propertyKey).slice(1);
        const argument_names = get_function_arguments(descriptor.value).slice(1);
        const original_method = descriptor.value;
        let usage = (params?.usage ?? commandName + ' ' + argument_names.map((name: string, index: number) => {
            let optional = false;
            const type = argument_types[index];
            let type_name = type.name;

            if (type == Client) return '';
            if (type == GuildMember || type == User) type_name = `@${type_name}`;
            if (type == RestAsString) return `${params.rest_required ? '[' : '<'}...${name}${params.rest_required ? '' : '?'}: String${params.rest_required ? ']' : '>'}`;
            if (type.prototype instanceof CustomArgumentType) return new type('').get_usage();

            if (name.includes('=') ||
                (name.includes('...') && !params.rest_required)
            ) {
                optional = true;
                name = name.replace(/\s*?=\s*?(?:null|undefined)/, '') + '?';
            }

            return `${optional ? '<' : '['}${name}: ${type_name}${optional ? '>' : ']'}`;
        }).filter(x => x).join(' ')).trim();

        params.usage = usage;

        descriptor.value = async function (...args) {
            const client: Client = args.find(arg => arg.constructor == Client);
            let message: CommandMessage = args[0];

            if (message?.author?.bot) return;

            const server_config = server_configs[message?.guild?.id];

            if (server_config['common.channel_list'].includes(message.channel.id) ==
                server_config['common.channel_list_as_blacklist']) return;
            
            if (server_config['common.command_list'].length &&
                server_config['common.command_list'].some(pattern => matcher.isMatch([commandName, ...params.aliases], pattern)) ==
                server_config['common.command_list_as_blacklist']) return;

            if (server_config['common.dm_list'].length &&
                server_config['common.dm_list'].some(pattern => matcher.isMatch([commandName, ...params.aliases], pattern)) ==
                server_config['common.dm_list_as_blacklist']) {
                const dm_channel = message.author.dmChannel ?? await message.author.createDM();

                message = new Proxy(message, {
                    get: (target, prop) => {
                        if (prop == 'channel') return dm_channel;
                        if (prop == 'reply') return dm_channel.send.bind(dm_channel)
    
                        return target[prop];
                    }
                });
            }

            if (!(message.channel instanceof DMChannel)
                && !message.channel.nsfw
                && params.nsfw
                && !server_configs[message?.guild?.id]['common.nsfw_all_channels']
                ) {
                message.react('💢');
                
                return message.channel.stopTyping();;
            }

            const prefixed_usage = get_prefix_str(message) + usage;

            let argv = string_argv(message.content);
            argv = argv.slice(1);

            if (params.history_expansion) {
                const last_message = [...message.channel.messages.cache].reverse().find(([,channel_message]) => {
                    if (!channel_message) return false;
                    if (channel_message.author == client.user) return false;
                    if (channel_message == message) return false;
                    if (channel_message.content?.startsWith('<')) return false;
                    
                    return true;
                });

                if (last_message) {
                    argv = argv.map(segment => {
                        if (!last_message[1]) return segment;
                        if (!last_message[1].content) return segment;
                        if (segment != '!!') return segment;

                        return last_message[1].content;
                    });
                }
            }

            if (message.channel instanceof DMChannel) {
                logger.info(`command ${commandName} called by ${message.author.tag} (${message.author.id})`);
            } else {
                logger.info(`command ${commandName} called by ${message.author.tag} (${message.author.id}) in server ${message.guild.name} (${message.guild.id}), channel #${message.channel.name} (${message.channel.id})`);
            }

            const argument_array: any[] = [message];

            for (let index = 0; index < argument_types.length; ++index) {
                let type = argument_types[index];
                const name = argument_names[index];
                let optional = false;
                if (name.includes('...')) {
                    type = new Rest(type);
                }

                if (name.includes('=') ||
                    (name.includes('...') && !params.rest_required) ||
                    (type == RestAsString && !params.rest_required) ||
                    (type.prototype instanceof CustomArgumentType && new type().optional))
                {
                    optional = true;
                }

                if (type != Client && argv[0] === undefined) {
                    if (!optional) {
                        let output = '';
                        if (params.missing_argument_message) output += `Error: missing argument \`${name}\`\n\n`;
                        if (params.incorrect_usage_message) output += `Usage: \`${prefixed_usage}\``;
                        if (output) message.reply(output);
                        return;
                    }

                    if (type.prototype instanceof CustomArgumentType) {
                        argument_array.push(new type());
                        continue;
                    }
                }

                if (type === Client) {
                    argument_array.push(client);
                } else if (type === Number) {
                    const number = +argv.shift();
                    if (!Number.isNaN(number)) {
                        argument_array.push(number);
                    } else if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, prefixed_usage, message);
                    }
                    argument_array.push(number);
                } else if (type === Integer) {
                    const number = +argv.shift();
                    if (Number.isInteger(number)) {
                        argument_array.push(number);
                    } else if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, prefixed_usage, message);
                    }
                } else if (type === Boolean) {
                    const bool_string = argv.shift();
                    if (/^true|t|1|yes|y$/i.test(bool_string)) {
                        argument_array.push(true);
                        continue;
                    }
                    if (/^false|f|0|no|n$/i.test(bool_string)) {
                        argument_array.push(false);
                        continue;
                    }
                    if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, prefixed_usage, message);
                    }
                } else if (type === User) {
                    const id = (argv.shift().trim().match(/\d+/) ?? [])[0];
                    const user = message.mentions.users.find(user => user.id == id);
                    if (user) {
                        argument_array.push(user);
                        continue;
                    } else if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, prefixed_usage, message);
                    }
                } else if (type == GuildMember) {
                    const id = (argv.shift()?.trim().match(/\d+/) ?? [])[0];
                    const member = message.mentions.members.find(member => member.user.id == id);
                    if (member) {
                        argument_array.push(member);
                        continue;
                    } else if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, prefixed_usage, message);
                    }
                } else if (type.constructor === Rest) {
                    if (type.type == String) {
                        argument_array.push(...argv.splice(0));
                    }
                    for (let number_str of argv.splice(0)) {
                        const number = +number_str;
                        if (Number.isNaN(number) && params.args_required) return reply_incorrect(params, name, prefixed_usage, message);
                        argument_array.push(number);
                    }
                } else if (type === RestAsString) {
                    argument_array.push(new RestAsString(argv.splice(0), message.content));
                } else if (type.prototype instanceof CustomArgumentType) {
                    const custom_argument: CustomArgumentType = new type(argv.shift());
                    if (!custom_argument.validate_argument()) return reply_incorrect(params, name, prefixed_usage, message);
                    argument_array.push(custom_argument);
                } else {
                    argument_array.push(argv.shift());
                }
            }

            if (argv.length && params.extraneous_argument_message) {
                let output = '';
                output += `Error: extraneous argument(s) \`[${argv.join(', ')}]\`\n\n`;
                if (params.incorrect_usage_message) output += `Usage: \`${prefixed_usage}\``;
                if (output) message.reply(output);
                return;
            }

            try {
                const result = original_method.apply(this, argument_array);
                if (result instanceof Promise) {
                    result.catch(error => {
                        if (!params.handle_errors) return;
                        message.channel.send(`An unknown error occured: \`${error}\``).catch(e => logger.warn(`rejection in replying with error message: ${e}`));

                        if (error instanceof Error) {
                            write_error(commandName, error);
                        } else {
                            logger.error(`command ${commandName} rejected: ${error}`);
                        }

                    }).finally(() => message.channel.stopTyping());
                } else { message.channel.stopTyping(); }
            } catch (error) {
                if (!params.handle_errors) return;
                message.channel.send(`An unknown error occured: \`${error.name} ${error.message}\``).catch(e => logger.warn(`rejection in replying with error message: ${e}`));
                message.channel.stopTyping();

                write_error(commandName, error);
            }
        };

        commands.push({
            infos: params.infos,
            description: params.description,
            commandName: commandName,
            group: params.group,
            usage: params.usage,
            hide: params.hide,
            aliases: params.aliases,
            example: params.example
        });

        DiscordCommand(commandName)(target, propertyKey, descriptor);
        params.aliases?.forEach(alias => DiscordCommand(alias)(target, propertyKey, descriptor));

        return descriptor;
    };
}

class Rest {
    constructor(public type: Function) { }
}