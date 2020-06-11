import { Discord, CommandMessage } from '@typeit/discord';
import { get_prefix } from '../server-config/ServerConfig';
import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { MessageEmbed } from '../utils/EmbedUtils';

@Discord(get_prefix)
export abstract class FunCommands {
    @Command('coin', {
        infos: 'flip a coin',
        extraneous_argument_message: false,
        group: CommandGroup.FUN,
        aliases: [
            'coinflip',
            'flipcoin'
        ]
    })
    private coin(message: CommandMessage) {
        const embed = new MessageEmbed();

        if (Math.random() > .5) {
            embed.setImage('https://cdn.discordapp.com/attachments/713177166174617650/720449568369672222/coin.gif');
            embed.setTitle('**Heads**')
        } else {
            embed.setImage('https://cdn.discordapp.com/attachments/713177166174617650/720479764074332180/coin.gif');
            embed.setTitle('**Tails**');
        }

        message.channel.send(embed);
    }
}