import { Client } from '@typeit/discord';
import { Message, TextChannel, PermissionResolvable } from 'discord.js';

export function HasPermission(permission: PermissionResolvable, options?: { error_message?: string | null, check_admin: boolean });

export function HasPermission(permission_list: PermissionResolvable[] | PermissionResolvable, options: { error_message?: string | null, check_admin: boolean } = {
    error_message: 'I need permissions to do this!',
    check_admin: true
}) {
    return (message: Message, client: Client) => {
        if (!Array.isArray(permission_list)) permission_list = [permission_list];

        const permissions = (message.channel as TextChannel).permissionsFor(client.user);

        for (const permission of permission_list) {
            if (!permissions.has(permission, options.check_admin)) {
                if (options.error_message) message.reply(options.error_message);

                return false;
            }
        }

        return true;
    }
}