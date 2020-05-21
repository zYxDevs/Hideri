import { GuardFunction } from '@typeit/discord';
import config from '../configs/config.json';

export function Admin(options: { error_message?: string | null } = {
    error_message: 'B-B-B-BAAAKAAAA, you\'re not allowed to use this command!'
}): GuardFunction<'message'> {
    return ([message], client, next) => {
        if (message.member.hasPermission("ADMINISTRATOR") || message.author.id == config.owner_id) return next();
        if (options.error_message) message.reply(options.error_message);
    }
}