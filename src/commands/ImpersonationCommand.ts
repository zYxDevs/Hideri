import { Discord, CommandMessage, Guard } from '@typeit/discord';
import config from '../configs/config.json';
import { Command } from '../ArgumentParser';
import { TextChannel, GuildMember } from 'discord.js';
import { IsTextChannel } from '../guards/IsTextChannel';
import { HasPermission } from '../guards/HasPermission';
import impersonation_commands from '../configs/impersonation_commands.json';
import { CommandGroup } from '../types/CommandGroup';
import { RandomUtils } from '../utils/RandomUtils';
import { RateLimit } from '../guards/RateLimit';
import { get_prefix } from '../server-config/ServerConfig';
import { Owner } from '../guards/Owner';
import { RestAsString } from '../argument-types/RestAsString';

impersonation_commands.forEach(({ name, info, description, text, aliases } : {
    name: string,
    info?: string,
    description?: string,
    text: string | string[] | Function,
    aliases?: string[]
}) => {
    if (Array.isArray(text)) text = RandomUtils.create_randomizer(text);

    @Discord(get_prefix)
    class Impersonation {
        @Guard(IsTextChannel(), HasPermission('MANAGE_WEBHOOKS', {
            error_message: 'I need webhook permissions for this!',
            check_admin: true
        }), RateLimit({
            scope: 'channel',
            rate_limit: 1
        }))
        @Command(name, {
            infos: info,
            description: description,
            group: CommandGroup.IMPERSONATION,
            aliases: aliases ?? []
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

@Discord(get_prefix)
export abstract class OwnerImpersonation {
    @Guard(IsTextChannel(), HasPermission('MANAGE_WEBHOOKS', {
        error_message: 'I need webhook permissions for this!',
        check_admin: true
    }), Owner())
    @Command('impersonate', {
        hide: true
    })
    private async impersonate(message: CommandMessage, member: GuildMember, text: RestAsString) {
        const webhook = await (message.channel as TextChannel).createWebhook(member.displayName, {
            avatar: member.user.avatarURL()
        });

        await webhook.send(text.get());

        message.delete().catch(() => {});

        webhook.delete();
    }
}