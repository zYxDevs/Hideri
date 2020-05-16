import { Client, ArgsOf } from '@typeit/discord';
import config from '../configs/config.json';

export function Owner(options: { error_message?: string | null } = {
    error_message: 'You dont look like my onii-chan!'
}) {
    return ([message]: ArgsOf<'message'>, client: Client) => {
        if (message.author.id == config.owner_id) return true;
        message.reply(options.error_message);
        return false;
    }
}