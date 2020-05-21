import { GuardFunction } from '@typeit/discord';

export const NotBot: GuardFunction<'message'> = ([message], client, next) => {
    if (!message.author) return;
    if (!message.author.bot) next();
}