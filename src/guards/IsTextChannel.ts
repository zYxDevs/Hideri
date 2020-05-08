import { Client } from '@typeit/discord';
import { Message, TextChannel } from 'discord.js';

export function IsTextChannel(options: { error_message?: string | null } = {
    error_message: 'This command can only be used in a text channel!'
}) {
    return (message: Message, client: Client) => {
        if (!(message.channel instanceof TextChannel)) {
            if (options.error_message) message.reply(options.error_message);
            return false;
        }

        return true;
    }
}



