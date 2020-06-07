import { GuardFunction } from '@typeit/discord';
import { get_prefix_str } from '../server-config/ServerConfig';

export const StartsWithPrefix: GuardFunction<'message'> = ([message], client, next) => {
    if (message.content.startsWith(get_prefix_str(message)) &&
        !/^<(?:@[!&]|#|:\S{1,32}:)\d{17,20}>/.test(message.content)) {
        next();
    }
}