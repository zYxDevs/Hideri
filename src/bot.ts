import { Discord, On, Client, CommandMessage, Guard } from '@typeit/discord';
import 'reflect-metadata';

import config from './config.json';
import { Command } from './ArgumentParser';
import { Owner } from './guards/Owner';
import { HelpEmbedBrowser } from './embed-browsers/HelpEmbedBrowser';
import { RegexUtils } from './utils/RegexUtils';
import { MessageEmbed } from 'discord.js';
import { IOnExt } from './types/IOnExt';
import { GIT_HASH, PACKAGE_VERSION, TYPESCRIPT_VERSION } from './constants';
import { BaseActivity } from './activities/BaseActivity';
import { RandomUtils } from './utils/RandomUtils';
import { MathUtils } from './utils/MathUtils';
import { ServerStatusActivity } from './activities/ServerStatusActivity';
import { AwayWatchActivity } from './activities/AwayWatchActivity';
import { GenericHelpActivity } from './activities/GenericHelpActivity';
import { MobileWatchActivity } from './activities/MobileWatchActivity';
import { NekoparaPlayActivity } from './activities/NekoparaPlayActivity';
import { TrapPlayActivity } from './activities/TrapPlayActivity';

@Discord({
    prefix: config.prefix
})
abstract class AppDiscord {
    private static _client: Client;

    private static last_activity: BaseActivity;
    private static last_timeout: NodeJS.Timer;

    private static activity_randomizer = RandomUtils.create_randomizer<{ new(client: Client): BaseActivity }>([
        AwayWatchActivity,
        GenericHelpActivity,
        MobileWatchActivity,
        NekoparaPlayActivity,
        ServerStatusActivity,
        TrapPlayActivity
    ]);

    public static start() {
        this._client = new Client();
        this._client.login(config.token, `${__dirname}/commands/*.js`, `${__dirname}/commands/image-macros/*.js`, `${__dirname}/embed-browsers/EmbedBrowser.js`);
    }

    @On('ready')
    private ready(client: Client) {
        AppDiscord.process_next_activity();
    }

    public static async destroy() {
        await this.last_activity.destroy();
        this._client.destroy();
    }

    private static async process_next_activity() {
        const client = this._client;
        client.clearTimeout(this.last_timeout);

        if (this.last_activity) await this.last_activity.destroy();

        await client.user.setPresence({
            status: 'online'
        });

        const constructor = this.activity_randomizer();

        const activity = new constructor(client);
        activity.create();

        AppDiscord.last_activity = activity;

        const next_delay = MathUtils.clamp(RandomUtils.gaussian(1, 10), .5, Infinity);
        this.last_timeout = client.setTimeout(() => this.process_next_activity(), next_delay * 60e3);
    }

    @Command('ping', {
        infos: 'Round-trip ping',
        extraneous_argument_message: false
    })
    private async ping(message: CommandMessage, client: Client) {
        const reply = await message.channel.send(`Calculating ping...`);
        reply.edit(`:ping_pong: Pong! ~${(reply.createdTimestamp - message.createdTimestamp).toFixed(2)}ms RTT`);
    }

    @Command('h', {
        infos: 'Get help',
        description: `Gets help (use \`${config.prefix}h [command]\` for command details`,
        extraneous_argument_message: false,
        aliases: ['help']
    })
    private async help(message: CommandMessage, command: string = null) {
        if (!command) return new HelpEmbedBrowser().send_embed(message);

        command = command.trim().replace(new RegExp(`^${RegexUtils.escape(config.prefix)}`, 'i'), '');
        const command_obj = (Client.getCommandsIntrospection() as IOnExt[]).find(({ commandName, aliases }) => commandName == command || aliases?.includes(command));
        if (!command_obj || command_obj.hide) return message.reply(`Error: command \`${command}\` not found`);
        const embed = new MessageEmbed({ title: `\`${command}\` command` });
        embed.addField('Group', command_obj.group);
        embed.addField('Info', command_obj.infos ?? 'None');
        embed.addField('Description', command_obj.description ?? 'None');
        embed.addField('Usage', `\`${command_obj.usage}\``);
        if (command_obj.aliases?.length) embed.addField('Aliases', `\`${command_obj.aliases.join(', ')}\``);
        message.channel.send(embed);
    }

    @Command('version', {
        infos: 'Get info about this version of HentaiBot',
        extraneous_argument_message: false
    })
    private async version(message: CommandMessage) {
        message.channel.send(`HentaiBot version \`${PACKAGE_VERSION} (${GIT_HASH})\` built with TypeScript version \`${TYPESCRIPT_VERSION}\``);
    }

    @Command('invite', {
        infos: 'Invite',
        description: 'Get invite link for bot',
        extraneous_argument_message: false
    })
    private async invite(message: CommandMessage, client: Client) {
        const user_count = new Set(client.guilds.cache.map(server => {
            return server.members.cache.map(member => {
                return member.user.id;
            });
        }).flat()).size;

        const embed = new MessageEmbed({
            title: 'Invite HentaiBot',
            url: 'https://discord.com/oauth2/authorize?client_id=507648234236411904&scope=bot&permissions=640928832',
            thumbnail: {
                url: client.user.avatarURL()
            },
            fields: [{
                name: '\ufeff',
                value: `Running on ${client.guilds.cache.size} servers\nServing ${user_count} users`
            }]
        });

        message.channel.send(embed);
    }

    @Guard(Owner())
    @Command('load_ext', {
        hide: true
    })
    private async load_ext(message: CommandMessage, module: string) {
        try {
            require(module);
            message.reply(`loaded module \`${module}\` successfully`);
        } catch (e) {
            message.reply(`error loading module \`${module}\`, \`${e.name} ${e.message}\``);
        }
    }
}

AppDiscord.start();

['SIGTERM', 'SIGINT'].forEach((signal: NodeJS.Signals) => {
    process.on(signal, () => {
        AppDiscord.destroy().finally(() => process.exit(0));
    })
});