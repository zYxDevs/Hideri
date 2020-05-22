import { On, ArgsOf, Client, Guard, Discord } from '@typeit/discord';
import { Matches } from '../guards/Matches';
import { NotBot } from '../guards/NotBot';
import { StartsWith } from '../guards/StartsWith';
import { Not } from '../guards/Not';
import { create_logger } from '../utils/Logger';
import { StartsWithPrefix } from '../guards/StartsWithPrefix';

const logger = create_logger(module);

@Discord()
export abstract class AyayaMessage {
    @Guard(NotBot, Not(StartsWithPrefix), Matches(/(?<!\S)(?:ayaya|cute[^\S\r\n]+chat)(?!\S)/i))
    @On('message')
    private async on_message([message]: ArgsOf<'message'>, client: Client) {
        message.react('712016858479460362').catch(reason => logger.warn(`Unable to react: ${reason}`));
    }
}