import { GuardFunction } from '@typeit/discord';

export function StartsWith(token: string): GuardFunction<'message'> {
    return ([message], client, next) => message.content.startsWith(token) && next()
}