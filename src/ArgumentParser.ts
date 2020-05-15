import 'reflect-metadata';
import get_function_arguments from 'get-function-arguments';
import { ICommandParams, Command as DiscordCommand, CommandMessage, Client } from '@typeit/discord';
import string_argv from 'string-argv';
import config from './configs/config.json';
import { CustomArgumentType } from './argument-types/CustomArgumentType.js';
import { RestAsString } from './argument-types/RestAsString.js';
import { Integer } from './argument-types/Integer.js';
import { CommandGroup } from './types/CommandGroup';
import { User, GuildMember, TextChannel, DMChannel } from 'discord.js';
import { create_logger } from './utils/Logger';
import fs from 'fs';
import path from 'path';
import logging from './configs/logging.json';

const writeFile = fs.promises.writeFile;

const logger = create_logger(module);

const write_error = (commandName: string, error: Error) => {
    const filename = path.join(__dirname, logging.log_dir, `error-${Date.now()}.stacktrace`);
    logger.error(`command ${commandName} errored: ${error.stack}`);
    logger.error(`full stacktrace has been written to ${filename}`);
    writeFile(filename, error.stack);
};

const default_options = {
    args_required: true,
    incorrect_usage_message: true,
    missing_argument_message: true,
    extraneous_argument_message: true,
    handle_errors: true,
    usage: null,
    rest_required: true
};

const reply_incorrect = (options, name: string, usage: string, message: CommandMessage) => {
    let output = '';
    if (options.missing_argument_message) output += `Error: incorrect argument \`${name}\`\n\n`;
    if (options.incorrect_usage_message) output += `Usage: \`${usage}\``;
    if (output) message.reply(output);
}

export interface ICommandParamsExt {
    group?: CommandGroup,
    usage?: string,
    hide?: boolean,
    aliases?: string[],
    args_required?: boolean,
    incorrect_usage_message?: boolean,
    missing_argument_message?: boolean,
    extraneous_argument_message?: boolean,
    handle_errors?: boolean,
    rest_required?: boolean
};

export function Command(commandName: string, params: ICommandParams & ICommandParamsExt = default_options) {
    logger.debug(`command ${commandName} created in group ${params.group}`);
    params = Object.assign({}, default_options, params);
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const argument_types = Reflect.getMetadata('design:paramtypes', target, propertyKey).slice(1);
        const argument_names = get_function_arguments(descriptor.value).slice(1);
        const original_method = descriptor.value;
        const usage = (params?.usage ?? config.prefix + commandName + ' ' + argument_names.map((name, index) => {
            let optional = false;
            const type = argument_types[index];
            if (type == Client) return '';
            if (type == RestAsString) return `${params.rest_required ? '[' : '<'}...${name}: String${params.rest_required ? ']' : '>'}`;
            if (type.prototype instanceof CustomArgumentType) return new type('').get_usage();

            if (name.includes('=') ||
                (name.includes('...') && !params.rest_required))
            {
                optional = true;
            }

            return `${optional ? '<' : '['}${name}: ${type.name}${optional ? '>' : ']'}`;
        }).filter(x => x).join(' ')).trim();

        params.usage = usage;
        params.group = params.group ?? CommandGroup.GENERAL;

        descriptor.value = function (...args) {
            const client: Client = args.find(arg => arg.constructor == Client);
            const message: CommandMessage = args[0];
            let argv = string_argv(message.content);
            argv = argv.slice(1);

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
                        if (params.incorrect_usage_message) output += `Usage: \`${usage}\``;
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
                        return reply_incorrect(params, name, usage, message);
                    }
                    argument_array.push(number);
                } else if (type === Integer) {
                    const number = +argv.shift();
                    if (Number.isInteger(number)) {
                        argument_array.push(number);
                    } else if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, usage, message);
                    }
                } else if (type === Boolean) {
                    const bool_string = argv.shift();
                    if (/true|t|1|yes|y/i.test(bool_string)) {
                        argument_array.push(true);
                        continue;
                    }
                    if (/false|f|0|no|n/i.test(bool_string)) {
                        argument_array.push(false);
                        continue;
                    }
                    if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, usage, message);
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
                        return reply_incorrect(params, name, usage, message);
                    }
                } else if (type == GuildMember) {
                    const id = (argv.shift().trim().match(/\d+/) ?? [])[0];
                    const member = message.mentions.members.find(member => member.user.id == id);
                    if (member) {
                        argument_array.push(member);
                        continue;
                    } else if (!params.args_required || optional) {
                        argument_array.push(undefined);
                    } else {
                        return reply_incorrect(params, name, usage, message);
                    }
                } else if (type.constructor === Rest) {
                    if (type.type == String) {
                        argument_array.push(...argv.splice(0));
                    }
                    for (let number_str of argv.splice(0)) {
                        const number = +number_str;
                        if (Number.isNaN(number) && params.args_required) return reply_incorrect(params, name, usage, message);
                        argument_array.push(number);
                    }
                } else if (type === RestAsString) {
                    argument_array.push(new RestAsString(argv.splice(0), message.content));
                } else if (type.prototype instanceof CustomArgumentType) {
                    const custom_argument: CustomArgumentType = new type(argv.shift());
                    if (!custom_argument.validate_argument()) return reply_incorrect(params, name, usage, message);
                    argument_array.push(custom_argument);
                } else {
                    argument_array.push(argv.shift());
                }
            }

            if (argv.length && params.extraneous_argument_message) {
                let output = '';
                output += `Error: extraneous argument(s) \`[${argv.join(', ')}]\`\n\n`;
                if (params.incorrect_usage_message) output += `Usage: \`${usage}\``;
                if (output) message.reply(output);
                return;
            }

            try {
                const result = original_method.apply(this, argument_array);
                if (result instanceof Promise) {
                    result.catch(error => {
                        if (!params.handle_errors) return;
                        message.channel.send(`An unknown error occured: \`${error}\``);

                        if (error instanceof Error) {
                            write_error(commandName, error);
                        } else {
                            logger.error(`command ${commandName} rejected: ${error}`);
                        }

                    }).finally(() => message.channel.stopTyping());
                } else { message.channel.stopTyping(); }
            } catch (error) {
                if (!params.handle_errors) return;
                message.channel.send(`An unknown error occured: \`${error.name} ${error.message}\``);
                message.channel.stopTyping();

                write_error(commandName, error);
            }
        };

        DiscordCommand(commandName, params)(target, propertyKey, descriptor);
        params.aliases?.forEach(alias => DiscordCommand(alias, Object.assign({}, params, { hide: true }))(target, propertyKey, descriptor));

        return descriptor;
    };
}

class Rest {
    constructor(public type: Function) { }
}