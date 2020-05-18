import { Client, ArgsOf } from '@typeit/discord';

export function Matches(expression: RegExp) {
    return ([message]: ArgsOf<'message'>, client: Client) => expression.test(message.content)
}