import { GuardFunction } from '@typeit/discord';
import { get_prefix_str } from '../server-config/ServerConfig';

export const StartsWithPrefix: GuardFunction<'message'> = ([message], client, next) => message.content.startsWith(get_prefix_str(message)) && next()