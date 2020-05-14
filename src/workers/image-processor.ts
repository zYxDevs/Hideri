import Jimp from 'jimp';
import { Font } from '@jimp/plugin-print';
import { CappedMap } from '../utils/CappedMap';

class ImageProcessor {
    static font_cache = new CappedMap<string, Promise<Font>>(1000);
    static image_cache = new CappedMap<string, Promise<Jimp> | Jimp>(500);

    static url_regex = /^<?((?:(?:http|https|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:((?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))))(?::\d{2,5})?(?:(?:\/|\?|#)[^\s]*?)?)>?$/i;
    static private_ip_regex = /^(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|(?:169\.254|192\.168)\.\d{1,3}\.\d{1,3}|2[4-5][0-9]\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    static image_extension_regex = /\.(png|jpe?g|jfif|gif|bmp|tiff)$/i;

    frame: {
        x: number,
        y: number,
        width: number,
        height: number,
        rot: number
    };

    constructor(private options: {
        image_location: string,
        mask_location: string,
        fonts?: string[],
        mime?: string,
        frame: {
            x: number,
            y: number,
            width: number,
            height: number,
            rot: number
        },
        segments: ({ type: 'text', data: string } | { type: 'image', data: string, image?: Jimp })[],
        emojis: string[]
    }) {
        this.frame = options.frame;
        
        if (!ImageProcessor.image_cache.has(options.image_location)) {
            ImageProcessor.image_cache.set(options.image_location, Jimp.read(options.image_location));
        }

        if (!ImageProcessor.image_cache.has(options.mask_location)) {
            ImageProcessor.image_cache.set(options.mask_location, Jimp.read(options.mask_location));
        }

        (options.fonts || [
            `${__dirname}../../../assets/fonts/opensans-black-128-emoji/opensans-black-128-emoji.fnt`,
            `${__dirname}../../../assets/fonts/opensans-black-64-emoji/opensans-black-64-emoji.fnt`,
            `${__dirname}../../../assets/fonts/opensans-black-32-emoji/opensans-black-32-emoji.fnt`,
            `${__dirname}../../../assets/fonts/opensans-black-16-emoji/opensans-black-16-emoji.fnt`
        ]).forEach(font => {
            if (ImageProcessor.font_cache.has(font)) return;

            ImageProcessor.font_cache.set(font, Jimp.loadFont(font))
        });
    }

    get image() {
        return ImageProcessor.get_copied_image(this.options.image_location);
    }
        

    get mask() {
        return ImageProcessor.get_copied_image(this.options.mask_location);
    }

    static async get_image_or_cached(location: string): Promise<Jimp> {
        const image = ImageProcessor.image_cache.get(location);

        if (!image) {
            const loaded_image = await Jimp.read(location);
            ImageProcessor.image_cache.set(location, loaded_image);

            return loaded_image;
        }

        return image;
    }

    static get_copied_image(location: string): Promise<Jimp> {
        return ImageProcessor.get_image_or_cached(location).then(image => image.clone());
    }

    async get_font(text: string, width: number, height: number): Promise<{
        font: Font,
        overflow: boolean
    }> {
        const fonts = ImageProcessor.font_cache.values();
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

    async process() {
        const image = await this.image;
        const mask = await this.mask;

        const blank = new Jimp(image.bitmap.width, image.bitmap.height, 'transparent');
        const blank_frame = new Jimp(this.frame.width, this.frame.height, 'transparent');

        let image_height = 0;

        for (const segment of this.options.segments) {
            if (segment.type != 'image') continue;

            const image = await (ImageProcessor.get_copied_image(segment.data).catch(() => null));

            if (!image) {
                (segment.type as any) = 'text';
                continue;
            }

            segment.image = image;

            const height = image.getHeight();
            const width = image.getWidth();

            image_height += this.frame.width / width * height;
        }

        const { font, overflow } = await this.get_font(this.options.segments.filter(s => s.type == 'text').map(s => s.data).join(' '), this.frame.width, this.frame.height - image_height);

        const emojis: Jimp[] = [];
        let emoji_index = 0;

        for (const emoji of this.options.emojis) {
            emojis.push(await ImageProcessor.get_copied_image(emoji));
        }

        let y_location = 0;

        for (let segment_index = 0; segment_index < this.options.segments.length; ++segment_index) {
            if (y_location > this.frame.height) break;

            const segment = this.options.segments[segment_index];
            if (segment.type == 'text') {
                let vertical_alignment: number = Jimp.VERTICAL_ALIGN_MIDDLE;
                if (segment_index != this.options.segments.length - 1) vertical_alignment = Jimp.VERTICAL_ALIGN_TOP
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
                const image = segment.image;
                if (!image) continue;

                image.contain(this.frame.width, this.frame.height - y_location, Jimp.HORIZONTAL_ALIGN_CENTER | (
                    segment_index == this.options.segments.length - 1 ? Jimp.VERTICAL_ALIGN_MIDDLE : Jimp.VERTICAL_ALIGN_TOP
                ));
                blank_frame.composite(image, 0, y_location);
                y_location += image.getHeight();
            }
        };

        if (this.frame.rot) blank_frame.rotate(this.frame.rot);

        const result = image.composite(blank.composite(blank_frame, this.frame.x, this.frame.y).mask(mask, 0 ,0), 0, 0);
        const buffer = await result.getBufferAsync(this.options.mime ?? Jimp.MIME_JPEG);

        return buffer;
    }
}

process.on('message', async message => {
    const options = JSON.parse(message);

    const processor = new ImageProcessor(options);

    const result = await processor.process();

    process.send(result);
})