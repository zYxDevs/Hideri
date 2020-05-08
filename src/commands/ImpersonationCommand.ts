import { Discord, CommandMessage, Client, Guard } from '@typeit/discord';
import config from '../config.json';
import { Command } from '../ArgumentParser';
import { TextChannel, GuildMember } from 'discord.js';
import { IsTextChannel } from '../guards/IsTextChannel';
import { HasPermission } from '../guards/HasPermission';
import { IMPERSONATION_COMMANDS } from '../impersonation_commands';
import { CommandGroup } from '../types/CommandGroup';

@Discord()
export abstract class ImpersonationCommand {
    constructor() {
        IMPERSONATION_COMMANDS.forEach(({ name, info, description, text, aliases }) => {
            @Discord({
                prefix: config.prefix
            })
            class Impersonation {
                @Guard(IsTextChannel(), HasPermission('MANAGE_WEBHOOKS'))
                @Command(name, {
                    infos: info,
                    description: description,
                    group: CommandGroup.IMPERSONATION,
                    aliases: aliases
                })
                private async exec(message: CommandMessage, member: GuildMember) {
                    const webhook = await (message.channel as TextChannel).createWebhook(member.displayName, {
                        avatar: member.user.avatarURL()
                    });

                    await webhook.send(typeof text == 'function' ? text() : text);

                    message.delete().catch(() => {});

                    webhook.delete();
                }
            }
        });
    }
}