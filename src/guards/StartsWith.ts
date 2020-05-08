import { Message } from 'discord.js';
import { Client } from '@typeit/discord';

export function StartsWith(token: string) {
    return (message: Message, client: Client) => message.content.startsWith(token)
}