import { Message } from 'discord.js';
import { Client } from '@typeit/discord';
import config from '../config.json';

export function Owner(options: { error_message?: string | null } = {
    error_message: 'You dont look like my onii-chan!'
}) {
    return (message: Message, client: Client) => {
        if (message.author.id == config.owner_id) return true;
        message.reply(options.error_message);
        return false;
    }
}