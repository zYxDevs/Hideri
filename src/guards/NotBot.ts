import { Message } from 'discord.js';
import { Client } from '@typeit/discord';

export function NotBot(message: Message, client: Client) {
    if (!message.author) return false;
    return !message.author.bot;
}