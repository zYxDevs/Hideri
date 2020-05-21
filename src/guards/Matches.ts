import { GuardFunction } from '@typeit/discord';

export function Matches(expression: RegExp): GuardFunction<'message'> {
    return ([message], client, next) => expression.test(message.content) && next()
}