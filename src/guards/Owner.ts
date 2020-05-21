import { GuardFunction } from '@typeit/discord';
import config from '../configs/config.json';

export function Owner(options: { error_message?: string | null } = {
    error_message: 'You dont look like my onii-chan!'
}): GuardFunction<'message'> {
    return ([message], client, next) => {
        if (message.author.id == config.owner_id) return next();
        message.reply(options.error_message);
    }
}