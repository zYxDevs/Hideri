import { Command } from '../ArgumentParser';
import { Discord, CommandMessage } from '@typeit/discord';
import config from '../configs/config.json';
import fetch from 'node-fetch';
import { CommandGroup } from '../types/CommandGroup';
import { EmbedUtils } from '../utils/EmbedUtils';
import { get_prefix } from '../server-config/ServerConfig';

@Discord(get_prefix)
export abstract class ImageCommand {
    @Command('ahegao', {
        infos: 'Get random ahegao picture',
        group: CommandGroup.COMMUNITIES,
        nsfw: true
    })
    private async ahegao(message: CommandMessage) {
        message.channel.startTyping();
        const { msg } = await (await fetch('https://ahegao.egecelikci.com/api')).json();
        message.channel.send(EmbedUtils.create_image_embed('Ahegao Result', msg));
    }

    @Command('bestboy', {
        hide: true,
        aliases: ['best_boy']
    })
    private async hibiki(message: CommandMessage) {
        message.channel.send(EmbedUtils.create_image_embed('Hibiki', 'https://cdn.discordapp.com/attachments/713123662085226587/714322327055368263/ev303.png'));
    }
}