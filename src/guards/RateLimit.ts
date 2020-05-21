import { GuardFunction } from '@typeit/discord';

export function RateLimit(options: { error_message?: string | null, rate_limit: number }): GuardFunction<'message'> {
    let last_message_time = 0;
    options = Object.assign({
        error_message: 'This command is on cooldown!'
    }, options);

    return ([message], client, next) => {
        const now = Date.now();
        if ((now - last_message_time) / 1000 < options.rate_limit) {
            options.error_message && message.reply(options.error_message);
            return;
        }

        last_message_time = now;
        next();
    }
}
