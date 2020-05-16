import { Client, ArgsOf } from '@typeit/discord';
import config from '../configs/config.json';

export function Admin(options: { error_message?: string | null } = {
    error_message: 'B-B-B-BAAAKAAAA, you\'re not allowed to use this command!'
}) {
    return ([message]: ArgsOf<'message'>, client: Client) => {
        if (message.member.hasPermission("ADMINISTRATOR") || message.author.id == config.owner_id) return true;
        message.reply(options.error_message);
        return false;
    }
}