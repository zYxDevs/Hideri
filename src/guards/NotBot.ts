import { Client, ArgsOf } from '@typeit/discord';

export function NotBot([message]: ArgsOf<'message'>, client: Client) {
    if (!message.author) return false;
    return !message.author.bot;
}