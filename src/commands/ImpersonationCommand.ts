import { Discord, CommandMessage, Guard } from '@typeit/discord';
import config from '../configs/config.json';
import { Command } from '../ArgumentParser';
import { TextChannel, GuildMember } from 'discord.js';
import { IsTextChannel } from '../guards/IsTextChannel';
import { HasPermission } from '../guards/HasPermission';
import impersonation_commands from '../configs/impersonation_commands.json';
import { CommandGroup } from '../types/CommandGroup';
import { RandomUtils } from '../utils/RandomUtils';

impersonation_commands.forEach(({ name, info, description, text, aliases } : {
    name: string,
    info?: string,
    description?: string,
    text: string | string[] | Function,
    aliases?: string[]
}) => {
    if (Array.isArray(text)) text = RandomUtils.create_randomizer(text);

    @Discord(config.prefix)
    class Impersonation {
        @Guard(IsTextChannel(), HasPermission('MANAGE_WEBHOOKS', {
            error_message: 'I need webhook permissions for this!',
            check_admin: true
        }))
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