import { GuardFunction } from '@typeit/discord';
import { CappedMap } from '../utils/CappedMap';

const default_options: {
    scope?: Scopes,
    error_message?: string
} = {
    error_message: 'This command is on cooldown!',
    scope: 'server'
};

type Scopes = 'server' | 'channel' | 'global';

export function RateLimit(options: typeof default_options & { rate_limit: number }): GuardFunction<'message'> {
    options = Object.assign({}, default_options, options);
    
    if (options.scope == 'global') {
        let last_message_time = 0;

        return ([message], client, next) => {
            const now = Date.now();
            if ((now - last_message_time) / 1000 < options.rate_limit) {
                options.error_message && message.reply(options.error_message);
                return;
            }

            last_message_time = now;
            next();
        };
    } else if (options.scope == 'server') {
        let last_messages = new CappedMap<string, number>(2000);

        return ([message], client, next) => {
            const now = Date.now();
            const id = message.guild?.id ?? message.channel.id;

            if (last_messages.has(id) && (now - last_messages.get(id)) / 1000 < options.rate_limit) {
                options.error_message && message.reply(options.error_message);
                return;
            }

            last_messages.set(id, now);
            next();
        };
    } else {
        let last_messages = new CappedMap<string, number>(4000);

        return ([message], client, next) => {
            const now = Date.now();
            const id = message.channel.id;

            if (last_messages.has(id) && (now - last_messages.get(id)) / 1000 < options.rate_limit) {
                options.error_message && message.reply(options.error_message);
                return;
            }

            last_messages.set(id, now);
            next();
        };
    }
}
