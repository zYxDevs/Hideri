import { Command } from '../ArgumentParser';
import { Discord, CommandMessage } from '@typeit/discord';
import fetch from 'node-fetch';
import { CommandGroup } from '../types/CommandGroup';
import { EmbedUtils, MessageEmbed } from '../utils/EmbedUtils';
import { get_prefix } from '../server-config/ServerConfig';
import { nekos } from '../apis/Instances';
import { RandomUtils } from '../utils/RandomUtils';
import astolfo from '../configs/astolfo.json';

@Discord(get_prefix)
export abstract class ImageCommand {
    // private ahegao_images: Promise<string[]> = fetch('https://assets.ahegao.egecelikci.com/data.json')
    //     .then(data => data.json())
    //     .then((images: string[]) => images.map(image => `https://assets.ahegao.egecelikci.com/images/${image}`));
    //
    // @Command('ahegao', {
    //     infos: 'Get random ahegao picture',
    //     group: CommandGroup.IMAGE_EMOTES,
    //     nsfw: true
    // })
    // private async ahegao(message: CommandMessage) {
    //     message.channel.send(new MessageEmbed({
    //         image: {
    //             url: RandomUtils.choice(await this.ahegao_images)
    //         }
    //     }));
    // }

    @Command('bestboy', {
        hide: true,
        aliases: ['best_boy']
    })
    private async hibiki(message: CommandMessage) {
        message.channel.send(EmbedUtils.create_image_embed('Hibiki', 'https://cdn.discordapp.com/attachments/713123662085226587/714322327055368263/ev303.png'));
    }

    // @Command('astolfo', {
    //     infos: 'Get an image of Astolfo',
    //     group: CommandGroup.IMAGE_EMOTES,
    //     nsfw: true
    // })
    // private astolfo(message: CommandMessage) {
    //     message.channel.send(new MessageEmbed({
    //         image: {
    //             url: `https://gitlab.com/christopher.wang/astolfo/-/raw/master/${encodeURIComponent(RandomUtils.choice(astolfo))}`
    //         }
    //     }));
    // }

    @Command('trap', {
        infos: 'Get a random trap',
        group: CommandGroup.IMAGE_EMOTES,
        aliases: [
            'josou',
            'femboy',
            'otoko',
            'otokonoko',
            'htrap',
            'hfemboy'
        ],
        nsfw: true,
        extraneous_argument_message: false
    })
    private async trap(message: CommandMessage) {
        message.channel.startTyping();
        const { url } = Math.random() > .5 ? await (await fetch('https://api.computerfreaker.cf/v1/trap')).json() : await nekos.nsfw.trap();

        return message.channel.send(new MessageEmbed({ image: { url: url } }));
    }
}