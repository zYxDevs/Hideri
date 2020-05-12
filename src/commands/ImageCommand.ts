import { Command } from '../ArgumentParser';
import { Discord, CommandMessage } from '@typeit/discord';
import config from '../configs/config.json';
import fetch from 'node-fetch';
import { CommandGroup } from '../types/CommandGroup';
import { EmbedUtils } from '../utils/EmbedUtils';

@Discord({
    prefix: config.prefix
})
export abstract class ImageCommand {
    @Command('ahegao', {
        infos: 'Get random ahegao picture',
        group: CommandGroup.COMMUNITIES
    })
    private async ahegao(message: CommandMessage) {
        message.channel.startTyping();
        const { msg } = await (await fetch('https://ahegao.egecelikci.com/api')).json();
        message.channel.send(EmbedUtils.create_image_embed('Ahegao Result', msg));
    }
}