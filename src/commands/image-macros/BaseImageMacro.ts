import Jimp from 'jimp';
import { CommandMessage, Client } from '@typeit/discord';
import { MessageAttachment } from 'discord.js';
import { Font } from '@jimp/plugin-print';
import fetch from 'node-fetch';

export abstract class BaseImageMacro {
    public frame: {
        x: number,
        y: number,
        width: number,
        height: number,
        rot: number
    };

    public static font_cache = new Map<string, Promise<Font>>();

    public static image_cache = new Map<string, Promise<Jimp>>();

    private static url_regex = /^<?((?:(?:http|https|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:((?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))))(?::\d{2,5})?(?:(?:\/|\?|#)[^\s]*?)?)>?$/i;

    private static private_ip_regex = /^(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|(?:169\.254|192\.168)\.\d{1,3}\.\d{1,3}|2[4-5][0-9]\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

    private static image_extension_regex = /\.(png|jpe?g|jfif|gif|bmp|tiff)$/i;

    constructor(private options: {
        image_location: string,
        mask_location: string,
        fonts?: string[],
        mime?: string,
        output_filename?: string
    }) {
        BaseImageMacro.image_cache.set(options.image_location, Jimp.read(options.image_location));
        BaseImageMacro.image_cache.set(options.mask_location, Jimp.read(options.mask_location));
        (options.fonts || [
            `${__dirname}../../../assets/fonts/opensans-black-128-emoji/opensans-black-128-emoji.fnt`,
            `${__dirname}../../../assets/fonts/opensans-black-64-emoji/opensans-black-64-emoji.fnt`,
            `${__dirname}../../../assets/fonts/opensans-black-32-emoji/opensans-black-32-emoji.fnt`,
            `${__dirname}../../../assets/fonts/opensans-black-16-emoji/opensans-black-16-emoji.fnt`
        ]).forEach(font => {
            if (BaseImageMacro.font_cache.has(font)) return;

            BaseImageMacro.font_cache.set(font, Jimp.loadFont(font))
        });
    }

    get image() {
        return BaseImageMacro.image_cache.get(this.options.image_location).then(image => Jimp.read(image));
    }

    get mask() {
        return BaseImageMacro.image_cache.get(this.options.mask_location).then(image => Jimp.read(image));
    }

    private get_extension(mime: string) {
        switch (mime) {
            case Jimp.MIME_X_MS_BMP:
            case Jimp.MIME_BMP: return 'bmp';
            case Jimp.MIME_GIF: return 'gif';
            case Jimp.MIME_JPEG: return 'jpeg';
            case Jimp.MIME_PNG: return 'png';
            case Jimp.MIME_TIFF: return 'tiff';

            default: return 'out';
        }
    }

    public async get_font(text: string, width: number, height: number): Promise<{
        font: Font,
        overflow: boolean
    }> {
        const fonts = BaseImageMacro.font_cache.values();
        let last_font = null;

        for await (const font of fonts) {
            last_font = font;
            if (Jimp.measureTextHeight(font, text, width, (text) => {
                if (text == '\ufffc') return { xadvance: font.info.size };
            }) <= height) return {
                font: font,
                overflow: false
            };
        }

        return {
            font: last_font,
            overflow: true
        };
    }

    public async exec(message: CommandMessage, client: Client, ...text_or_images: string[]) {
        const start = Date.now();
        message.channel.startTyping();

        const image = await this.image;
        const mask = await this.mask;
        const blank = new Jimp(image.bitmap.width, image.bitmap.height, 'transparent');
        const blank_frame = new Jimp(this.frame.width, this.frame.height, 'transparent');

        let emojis: Jimp[] = [];
        let emoji_index = 0;
        const segments: ({ type: 'text', data: string } | { type: 'image', data: Promise<Jimp> })[] = [];

        if (text_or_images.length == 1 && text_or_images[0] == '!!') {
            const last_message = [...message.channel.messages.cache].reverse().find(([,channel_message]) => channel_message?.author != client.user && channel_message != message);
            if (!last_message) return;
            const attachment = last_message[1].attachments.find(attachment => BaseImageMacro.image_extension_regex.test(attachment.url));

            if (last_message[1].content) {
                segments.push({
                    type: 'text',
                    data: last_message[1].content
                })
            }
            
            if (attachment) {
                segments.push({
                    type: 'image',
                    data: Jimp.read(attachment.url).catch(() => null)
                });
            }
        } else if (text_or_images.length == 0) {
            const attachment = message.attachments.find(attachment => BaseImageMacro.image_extension_regex.test(attachment.url));

            if (attachment) {
                segments.push({
                    type: 'image',
                    data: Jimp.read(attachment.url).catch(() => null)
                });
            }
        } else {
            for (let segment of text_or_images) {
                let [ ,url, ip ] = (segment.match(BaseImageMacro.url_regex) || []);
                if (url && !BaseImageMacro.private_ip_regex.test(ip || '')) {
                    if (!/^(?:https?|ftp):\/\//i.test(url)) url = `http://${url}`;

                    const exists = await fetch(url, {
                        method: 'HEAD',
                        timeout: 1000
                    }).then(() => true).catch(() => false);

                    if (exists) {
                        segments.push({
                            type: 'image',
                            data: Jimp.read({
                                url: url
                            } as any).catch(() => null)
                        });
                        continue;
                    }
                }

                const [, emoji ] = (segment.match(/<:[\w~]+:(\d+)>/) || []);
                if (emoji) {
                    emojis.push(await Jimp.read({
                        url: `https://cdn.discordapp.com/emojis/${emoji}.png`
                    } as any));
                    segment = '\ufffc';
                }

                const [, user_id ] = (segment.match(/<@!(\d+)>/) || []);
                if (user_id) {
                    const member = message.guild.members.cache.find(member => member.id == user_id);
                    if (member && member.user.avatarURL()) {
                        segments.push({
                            type: 'image',
                            data: Jimp.read({
                                url: member.user.avatarURL().replace('.webp', '.png?size=512')
                            } as any).catch(() => null)
                        });
                        continue;
                    }
                }

                if (segments[segments.length - 1]?.type != 'text') segments.push({ type: 'text', data: '' });

                segments[segments.length - 1].data += ` ${segment}`;
            }
        }

        let image_height = 0;

        for (const segment of segments) {
            if (segment.type != 'image') continue;
            const image = await segment.data;

            if (!image) continue;

            const height = image.getHeight();
            const width = image.getWidth();

            image_height += this.frame.width / width * height;
        }

        const { font, overflow } = await this.get_font(segments.filter(s => s.type == 'text').map(s => s.data).join(' '), this.frame.width, this.frame.height - image_height);

        emojis = emojis.map(emoji => emoji.resize(font.info.size, font.info.size));

        let y_location = 0;

        for (let segment_index = 0; segment_index < segments.length; ++segment_index) {
            if (y_location > this.frame.height) break;

            const segment = segments[segment_index];
            if (segment.type == 'text') {
                let vertical_alignment: number = Jimp.VERTICAL_ALIGN_MIDDLE;
                if (segment_index != segments.length - 1) vertical_alignment = Jimp.VERTICAL_ALIGN_TOP
                if (overflow) vertical_alignment = Jimp.VERTICAL_ALIGN_TOP;

                blank_frame.print(font, 0, y_location, {
                    text: segment.data,
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: vertical_alignment,
                    charHandler: (text: string) => {
                        if (text != '\ufffc') return;
                        return {
                            x: 0,
                            y: 0,
                            width: font.info.size,
                            height: font.info.size,
                            xoffset: 0,
                            yoffset: 12,
                            xadvance: font.info.size + 2,
                            get page() { return emojis[emoji_index++ % emojis.length] }
                        }
                    }
                }, this.frame.width, this.frame.height - y_location, (err, image, { y }) => y_location = y);
            } else if (segment.type == 'image') {
                const image = await segment.data;
                if (!image) continue;

                image.contain(this.frame.width, this.frame.height - y_location, Jimp.HORIZONTAL_ALIGN_CENTER | (
                    segment_index == segments.length - 1 ? Jimp.VERTICAL_ALIGN_MIDDLE : Jimp.VERTICAL_ALIGN_TOP
                ));
                blank_frame.composite(image, 0, y_location);
                y_location += image.getHeight();
            }
        };

        if (this.frame.rot) blank_frame.rotate(this.frame.rot);

        const result = image.composite(blank.composite(blank_frame, this.frame.x, this.frame.y).mask(mask, 0 ,0), 0, 0);
        const buffer = await result.getBufferAsync(this.options.mime ?? Jimp.MIME_JPEG);

        console.log(Date.now() - start);

        message.channel.send(new MessageAttachment(buffer, `${this.options.output_filename ?? 'output'}.${this.get_extension(this.options.mime ?? Jimp.MIME_JPEG)}`));
    }
}