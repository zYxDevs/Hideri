import { GuardFunction } from '@typeit/discord';
import { CappedMap } from '../utils/CappedMap';
import { Message } from 'discord.js';
import { RateLimiter } from 'limiter';

const default_options: {
    scope?: Scopes,
    error_message?: string,
    rate_limit?: number,
    rate_limit_amount?: number,
    rate_limiters?: {
        limit: number,
        amount?: number,
        scope?: Scopes
    }[]
} = {
    error_message: 'This command is on cooldown!',
    scope: 'server',
    rate_limit: 1,
    rate_limit_amount: 1
};

type Scopes = 'server' | 'channel' | 'global';

const create_limiter_getter = (scope: Scopes, rate_limit: number, rate_limit_amount: number) => {
    if (scope == 'global') {
        const limiter = new RateLimiter(rate_limit_amount, rate_limit * 1000);

        return () => limiter;
    }

    const limiters: { [key: string]: RateLimiter } = {};

    return (message: Message) => {
        let key: string;

        if (scope == 'server') key = message.guild?.id ?? message.channel.id;
        if (scope == 'channel') key = message.channel.id;

        let limiter = limiters[key];

        if (!limiter) limiter = limiters[key] = new RateLimiter(rate_limit_amount, rate_limit * 1000);

        return limiter;
    };
};

export function RateLimit(options: typeof default_options): GuardFunction<'message'> {
    options = Object.assign({}, default_options, options);
    if (!options.rate_limiters) options.rate_limiters = [{
        limit: options.rate_limit,
        amount: options.rate_limit_amount
    }];

    const limiters = options.rate_limiters.map(limiter => create_limiter_getter(limiter.scope ?? options.scope, limiter.limit, limiter.amount ?? 1));

    return ([message], client, next) => {
        const rate_limited = limiters.some(limiter => !limiter(message).tryRemoveTokens(1));

        if (rate_limited) {
            options.error_message && message.reply(options.error_message);
            return;
        }

        return next();
    };
}
