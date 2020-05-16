import { Client, ArgsOf } from '@typeit/discord';

export function StartsWith(token: string) {
    return ([message]: ArgsOf<'message'>, client: Client) => message.content.startsWith(token)
}