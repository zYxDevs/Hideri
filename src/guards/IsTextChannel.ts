import { GuardFunction } from '@typeit/discord';
import { TextChannel } from 'discord.js';

export function IsTextChannel(options: { error_message?: string | null } = {
    error_message: 'This command can only be used in a text channel!'
}): GuardFunction<'message'> {
    return ([message], client, next) => {
        if (!(message.channel instanceof TextChannel)) {
            if (options.error_message) message.reply(options.error_message);
            return;
        }

        next();
    }
}



