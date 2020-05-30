import { MultiKeyMap } from '../utils/MultiKeyMap';
import nekobot_tags from '../configs/nekobot_tags.json';
import { Discord, CommandMessage, Guard, Client } from '@typeit/discord';
import { get_prefix, server_configs, get_prefix_str } from '../server-config/ServerConfig';
import { Command, KwArgs } from '../ArgumentParser';
import { StringUtils } from '../utils/StringUtils';
import { SetArgumentType } from '../argument-types/SetArgumentType';
import { DMChannel, Message, MessageAttachment, User, GuildMember } from 'discord.js';
import { nekobot } from '../apis/Instances';
import { EmbedUtils, MessageEmbed } from '../utils/EmbedUtils';
import { MessageUtils } from '../utils/MessageUtils';
import { MathUtils } from '../utils/MathUtils';
import { CommandGroup } from '../types/CommandGroup';
import { RateLimit } from '../guards/RateLimit';
import { RestAsString } from '../argument-types/RestAsString';

const enum ArgumentType {
    IMAGE = 'image',
    STRING = 'text',
    NUMBER = 'number',
    REST = 'string'
};

const image_gen_types = new MultiKeyMap<string, ArgumentType[]>([
    [
        [
            'animeFace',
            'awooify',
            'baguette',
            'blurpify',
            'deepFry',
            'iphoneX',
            'jpeg',
            'lolice',
            'threats',
            'trash',
        ], [ArgumentType.IMAGE]
    ], [
        'captcha', [ArgumentType.IMAGE, ArgumentType.REST]
    ], [
        [
            'changeMyMind',
            'clyde',
            'fact',
            'kannagen',
            'trumpTweet'
        ], [ArgumentType.REST]
    ],
    [
        'magik', [ArgumentType.IMAGE, ArgumentType.NUMBER]
    ], [
        [
            'ship',
            'whoWouldWin'
        ], [ArgumentType.IMAGE, ArgumentType.IMAGE]
    ], [
        [
            'tweet',
            'phComment'
        ], [ArgumentType.STRING, ArgumentType.REST]
    ], [
        'ddlc', [...Array(4).fill(ArgumentType.STRING), ArgumentType.REST]
    ]
]);

const image_endpoints = [...nekobot_tags.image_endpoints.nsfw, ...nekobot_tags.image_endpoints.sfw];

class NekoBotArgumentType extends SetArgumentType {
    public argument_list = [...image_endpoints, ...image_gen_types.keys()]
}

const monika_faces = [...'abcdefghijklmnopqr'];
const natsuki_faces = [...'abcdefghijklmnopqrstuvwxyz', '1t', '2bt', '2bta', '2btb', '2btc', '2btd', '2bte', '2btf', '2btg', '2bth', '2bti', '2t', '2ta', '2tb', '2tc', '2td', '2te', '2tf', '2tg', '2th', '2ti'];
const sayori_faces = [...'abcdefghijklmnopqrstuvwxy'];
const yuri_faces = [...'abcdefghijklmnopqrstuvwx', 'y1', 'y2', 'y3', 'y4', 'y5', 'y6', 'y7'];

nekobot_tags.image_commands.forEach(({ name, endpoint, description, aliases }) => {
    @Discord(get_prefix)
    class NekoBotImageCommand {
        @Guard(RateLimit({
            scope: 'channel',
            rate_limit: 2.5
        }))
        @Command(name, {
            description: description,
            aliases: aliases,
            group: CommandGroup.IMAGE_MACROS,
            history_expansion: false,
            usage: `${name} [image]`
        })
        private async exec(message: CommandMessage, client: Client, image: string = null) {
            const image_url = await MessageUtils.get_image(image, message, client);

            if (!image_url) return message.reply('Error: missing argument `image`');

            message.channel.startTyping();

            const result = await nekobot.imageGen[endpoint](image_url);

            if (!result) return;

            message.channel.send(new MessageAttachment(result));
        }
    }
});

nekobot_tags.text_commands.forEach(({ name, endpoint, description, aliases }) => {
    @Discord(get_prefix)
    class NekoBotTextCommand {
        @Guard(RateLimit({
            scope: 'channel',
            rate_limit: 2.5
        }))
        @Command(name, {
            description: description,
            aliases: aliases,
            group: CommandGroup.IMAGE_MACROS
        })
        private async exec(message: CommandMessage, text: RestAsString) {
            message.channel.startTyping();

            const result = await nekobot.imageGen[endpoint](text.get());

            if (!result) return;

            message.channel.send(new MessageAttachment(result));
        }
    }
});

@Discord(get_prefix)
export abstract class NekoBotCommand {
    @Command('nekobot', {
        rest_required: false,
        group: CommandGroup.IMAGE_EMOTES
    })
    private async nekobot(message: CommandMessage, client: Client, command: NekoBotArgumentType, ...params: string[]) {
        // abandon all hope
        // ye who enter here

        if (StringUtils.ci_includes(image_endpoints, command.get())) {
            const image_command = StringUtils.ci_get(image_endpoints, command.get());

            if (!(message.channel instanceof DMChannel) &&
                !message?.channel?.nsfw &&
                !server_configs[message?.guild?.id]['common.nsfw_all_channels'] &&
                nekobot_tags.image_endpoints.nsfw.includes(image_command)) {
                
                return message.react('💢');
            }

            message.channel.startTyping();
            
            const image = await nekobot.imageEndpoint.getImage(image_command);
            if (!image) return;

            const embed = EmbedUtils.create_image_embed('NekoBot Result', image);

            message.channel.send(embed);
        } else if (StringUtils.ci_includes([...image_gen_types.keys()], command.get())) {
            message.channel.startTyping();

            const image_gen_command = StringUtils.ci_get([...image_gen_types.keys()], command.get());
            const image_gen_arguments = image_gen_types.get(image_gen_command);

            const parsed_arguments = [];

            const prefix = get_prefix_str(message);
            const usage = `${prefix}nekobot ${image_gen_command} ` + image_gen_arguments.map(a => `[${a}]`).join(' ');

            for (let index = 0; index < image_gen_arguments.length; ++index) {
                const argument_type = image_gen_arguments[index];
                const argument = params[index];

                switch (argument_type) {
                    case ArgumentType.STRING:
                        parsed_arguments.push(argument);
                        break;
                    
                    case ArgumentType.REST:
                        const segment = params.slice(index);
                        if (segment.length) {
                            parsed_arguments.push(params.slice(index).join(' '))
                        } else {
                            parsed_arguments.push(undefined);
                        }
                        break;
                    
                    case ArgumentType.NUMBER:
                        const number = parseInt(argument);
                        if (Number.isNaN(number)) {
                            parsed_arguments.push(undefined);
                        } else {
                            parsed_arguments.push(number);
                        }

                        break;
                    
                    case ArgumentType.IMAGE:
                        const image = await MessageUtils.get_image(argument, message, client, {
                            history_expansion: false
                        });
                        if (image) {
                            parsed_arguments.push(image);
                        } else {
                            parsed_arguments.push(undefined);
                        }

                        break;
                }
            }

            if (image_gen_command == 'magik') {
                if (!parsed_arguments[0]) return message.reply(`Incorrect usage!\n\nUsage:\`${prefix}nekobot magik [image: string] <intensity: number>\``);
                if (typeof parsed_arguments[1] == 'number') parsed_arguments[1] = MathUtils.clamp(parsed_arguments[1], 0, 10);

                const result = await (nekobot.imageGen.magik as any)(...parsed_arguments);
                if (!result) return;

                const embed = EmbedUtils.create_image_embed('NekoBot result', result);

                message.channel.send(embed);
            } else if (image_gen_command == 'ddlc') {
                const [ character, background, body, face, text ] = (parsed_arguments as string[]);

                const base_ddlc_usage = `${prefix}nekobot ddlc`;

                return this.process_ddlc(message, base_ddlc_usage, character, background, body, face, text);
            } else if (image_gen_command == 'phComment') {
                const user = message.mentions.users.first(1)[0];

                if (!user) return message.reply(`Incorrect usage!\n\nUsage:\`${prefix}nekobot phComment [@member] [text]\``); 

                const result = await nekobot.imageGen.phComment(user.avatarURL({
                    format: 'png'
                }), parsed_arguments[1], user.username);

                if (!result) return;

                const embed = EmbedUtils.create_image_embed('NekoBot result', result);

                message.channel.send(embed);
            } else {
                if (parsed_arguments.some(arg => arg === undefined)) return message.reply(`Incorrect usage!\n\nUsage:\`${usage}\``);

                const result = await nekobot.imageGen[image_gen_command](...parsed_arguments);

                if (!result) return;

                const embed = EmbedUtils.create_image_embed('NekoBot result', result);

                message.channel.send(embed);
            }
        }
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('captcha', {
        description: 'generate a captcha',
        group: CommandGroup.IMAGE_MACROS
    })
    private async captcha(message: Message, client: Client, image: string, text: RestAsString) {
        const image_url = await MessageUtils.get_image(image, message, client);
        if (!image_url) return;

        message.channel.startTyping();

        const result = await nekobot.imageGen.captcha(image_url, text.get());

        if (!result) return;

        message.channel.send(new MessageAttachment(result));
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('magik', {
        description: 'magik-ify an image',
        group: CommandGroup.IMAGE_MACROS
    })
    private async magik(message: Message, client: Client, image: string, intensity: number = 0) {
        const image_url = await MessageUtils.get_image(image, message, client);
        if (!image_url) return;

        message.channel.startTyping();

        const result = await nekobot.imageGen.magik(image_url, MathUtils.clamp(~~intensity, 0, 10));

        if (!result) return;

        message.channel.send(new MessageAttachment(result));
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('phcomment', {
        description: 'make a comment on pornhub',
        group: CommandGroup.IMAGE_MACROS
    })
    private async phcomment(message: Message, client: Client, member: GuildMember, text: RestAsString) {
        message.channel.startTyping();

        const result = await nekobot.imageGen.phComment(member.user.avatarURL({
            format: 'png'
        }), text.get(), member.displayName);

        if (!result) return;

        message.channel.send(new MessageAttachment(result));
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('ship', {
        description: 'ship two members',
        group: CommandGroup.IMAGE_MACROS
    })
    private async ship(message: Message, client: Client, member1: GuildMember, member2: GuildMember) {
        message.channel.startTyping();
        const result = await nekobot.imageGen.ship(member1.user.avatarURL({
            format: 'png'
        }), member2.user.avatarURL({
            format: 'png'
        }));

        if (!result) return;

        message.channel.send(new MessageAttachment(result));
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('whowouldwin', {
        description: 'who would win?',
        group: CommandGroup.IMAGE_MACROS
    })
    private async whowouldwin(message: Message, client: Client, member1: GuildMember, member2: GuildMember) {
        message.channel.startTyping();
        const result = await nekobot.imageGen.whoWouldWin(member1.user.avatarURL({
            format: 'png'
        }), member2.user.avatarURL({
            format: 'png'
        }));

        if (!result) return;

        message.channel.send(new MessageAttachment(result));
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('tweet', {
        description: 'create a tweet',
        group: CommandGroup.IMAGE_MACROS
    })
    private async tweet(message: Message, client: Client, handle: string, text: RestAsString) {
        message.channel.startTyping();
        const result = await nekobot.imageGen.tweet(handle, text.get());

        if (!result) return;

        message.channel.send(new MessageAttachment(result));
    }

    @Guard(RateLimit({
        scope: 'channel',
        rate_limit: 2.5
    }))
    @Command('ddlc', {
        description: 'have one of the dokis say something',
        group: CommandGroup.IMAGE_MACROS,
        rest_required: true,
        kwargs: {
            character: 'monika|sayori|natsuki|yuri',
            background: 'bedroom|class|closet|club|corridor|house|kitchen|residential|sayori_bedroom',
            body: '1|2|1b|2b',
            face: 'string'
        },
        example: `ddlc i love you anon --character=sayori --background=sayori_bedroom --body=1 --face=a`
    })
    private async ddlc(message: Message, kwargs: KwArgs, ...text: string[]) {
        message.channel.startTyping();

        return this.process_ddlc(message,
            `${get_prefix_str(message)}ddlc`,
            kwargs.character ?? 'monika',
            kwargs.background ?? 'class',
            kwargs.body ?? '1',
            kwargs.face ?? 'a',
            text.join(' ')
        );
    }

    private async process_ddlc(message: Message, base_ddlc_usage: string, character: string, background: string, body: string, face: string, text: string) {
        const background_usage = '[bedroom|class|closet|club|corridor|house|kitchen|residential|sayori_bedroom]';

        let faces = [];

        switch (character?.toLowerCase()) {
            case 'y': case 'yuri':
                faces = yuri_faces;
                break;
            
            case 's': case 'sayori':
                faces = sayori_faces;
                break;
            
            case 'n': case 'natsuki':
                faces = natsuki_faces;
        }

        if ([character, background, body, face, text].some(arg => arg === undefined) ||
            !/^(monika|yuri|natsuki|sayori|m|y|n|s)$/i.test(character) ||
            !/^(bedroom|class|closet|club|corridor|house|kitchen|residential|sayori_bedroom)$/i.test(background) ||
            !/^(1b?|2b?)$/i.test(body)
        ) {
            return message.reply(`Incorrect usage!\n\nUsage:\`${base_ddlc_usage} ${/^(monika|yuri|natsuki|sayori|m|y|n|s)$/i.test(character) ? character : '[monika|yuri|natsuki|sayori|m|y|n|s]'} ${background_usage} [body: 1|2|1b|2b] [face${faces.length ? ': ' + faces.join('|') : ''}] [text: string]\``);
        }

        if (/^(monika|m)$/i.test(character) && !/^(1|2)$/i.test(body)) {
            return message.reply(`Incorrect usage!\n\nUsage:\`${base_ddlc_usage} monika ${background_usage} [body: 1|2] [face: ${monika_faces.join('|')}] [text: string]\``);
        }

        if (/^(monika|m)$/i.test(character) && !monika_faces.includes(face.toLowerCase())) {
            return message.reply(`Incorrect usage!\n\nUsage:\`${base_ddlc_usage} monika ${background_usage} [body: 1|2] [face: ${monika_faces.join('|')}] [text: string]\``);
        }

        if (/^(yuri|y|sayori|s|natsuki|n)$/i.test(character) && !faces.includes(face.toLowerCase())) {
            return message.reply(`Incorrect usage!\n\nUsage:\`${base_ddlc_usage} ${character} ${background_usage} [body: 1|2|1b|2b] [face: ${yuri_faces.join('|')}] [text: string]\``);
        }

        const ddlc_result = await nekobot.imageGen.ddlc(
            character.toLowerCase(),
            background.toLowerCase(),
            body.toLowerCase(),
            face.toLowerCase(),
            text
        );

        if (!ddlc_result) return;

        const embed = new MessageEmbed();
        embed.setImage(ddlc_result);

        message.channel.send(embed);
    }
}