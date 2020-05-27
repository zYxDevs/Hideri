import { CommandMessage, Discord, Client } from '@typeit/discord';
import { User } from 'discord.js';
import moment from 'moment-timezone';
import { get_prefix } from '../server-config/ServerConfig';
import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { TimezoneUtils } from '../utils/TimezoneUtils';

@Discord(get_prefix)
export abstract class MiscCommands {
    @Command('creation_date', {
        description: 'Get the creation date of a user/channel/server',
        group: CommandGroup.MISC,
        aliases: [
            'creationdate',
            'creation',
            'create_date',
            'createdate'
        ],
        usage: 'creation_date <@user|#channel>'
    })
    private async creation_date(message: CommandMessage, client: Client, snowflake: string = null) {
        let snowflake_type = 'unknown';

        if (snowflake) {
            const user_match = snowflake.match(/^<@!(\d{17,20})>$/);
            const channel_match = snowflake.match(/^<#(\d{17,20})>$/);

            if (user_match) {
                snowflake_type = 'user';
                snowflake = user_match[1];
            } else if (channel_match) {
                snowflake_type = 'channel'
                snowflake = channel_match[1];
            }

        } else if (message?.guild?.id) {
            snowflake_type = 'server';
            snowflake = message.guild.id;
        } else {
            snowflake = message.author.id;
            snowflake_type = 'user';
        }

        if (!/\d{17,20}/.test(snowflake)) return message.channel.send('Error: unknown snowflake');

        let snowflake_text = 'That snowflake was created on';

        switch (snowflake_type) {
            case 'user':
                const user: User = await client.users.fetch(snowflake).catch(() => null);
                snowflake_text = user ? `User ${user.username}#${user.discriminator} created their account on` : `That user created their account on`;
                break;
            case 'server':
                const server = client.guilds?.cache?.get(snowflake);
                snowflake_text = server ? `Server ${server.name} was created on` : `This server was created on`;
                break;
            case 'channel':
                const channel = await client.channels.fetch(snowflake).catch(() => null);
                snowflake_text = channel?.name ? `Channel #${channel.name} was created on` : `That channel was created on`;
        }

        const time = +snowflake / 4194304 + 1420070400000;

        const zone = TimezoneUtils.get_timezone_from_region(message.guild?.region);

        message.channel.send(`${snowflake_text} ${moment(time).tz(zone).format('M/D/YYYY, h:mm:ss A zz')}`);
    }

    @Command('stoptyping', {
        group: CommandGroup.MISC,
        aliases: [ 'stop_typing' ],
        description: 'stops the bot typing in the channel if the bot is stuck typing',
        extraneous_argument_message: false
    })
    private stop_typing(message: CommandMessage) {
        message.channel.stopTyping(true);
    }
}