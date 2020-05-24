import { On, ArgsOf, Client, Guard, Discord } from '@typeit/discord';
import { Matches } from '../guards/Matches';
import { NotBot } from '../guards/NotBot';
import { create_logger } from '../utils/Logger';
import title from 'title';

const logger = create_logger(module);

@Discord()
export abstract class RavioliMessage {
    @Guard(NotBot, Matches(/^\s*ravioli\s+ravioli\s*$/i))
    @On('message')
    private async on_message([message]: ArgsOf<'message'>, client: Client) {
        let reply = `don't lewd the dragon loli`;
        if (message.content == message.content.toUpperCase()) {
            reply = reply.toUpperCase() + '!';
        } else if (message.content.match(/[A-Z]/g)?.length > 6) {
            reply = reply.replace(/\w/g, w => Math.random() > .5 ? w.toUpperCase() : w.toLowerCase());
        } else if (message.content.match(/Ra/g)?.length == 1) {
            reply = reply[0].toUpperCase() + reply.slice(1);
        } else if (message.content.match(/Ra/g)?.length == 2) {
            reply = title(reply) + '.';
        }

        message.channel.send(reply).catch(e => logger.warn(`unable to send reply: ${e}`));
    }
}