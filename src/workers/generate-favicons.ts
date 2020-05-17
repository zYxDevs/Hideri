import sharp from 'sharp';
import fs from 'fs';
import fetch from 'node-fetch';
import { WorkerLogger as logger } from './WorkerLogger';

const favicon_levels = [48, 32, 16];

const get_row_stride = width => {
    if (width % 32 === 0) {
        return width / 8;
    } else {
        return 4 * (Math.floor(width / 32) + 1);
    }
};

const get_ico_header = (num_of_images: number) => {
    const buf = Buffer.alloc(6);

    buf.writeUInt16LE(0, 0);
    buf.writeUInt16LE(1, 2);
    buf.writeUInt16LE(num_of_images, 4);

    return buf;
};

const get_bmp_info_header = width => {
    const buf = Buffer.alloc(40);
    // https://en.wikipedia.org/wiki/ICO_(file_format)
    // ...Even if the AND mask is not supplied,
    // if the image is in Windows BMP format,
    // the BMP header must still specify a doubled height.
    const height = width * 2;
    const bpp = 32;

    buf.writeUInt32LE(40, 0); // The size of this header (40 bytes)
    buf.writeInt32LE(width, 4); // The bitmap width in pixels (signed integer)
    buf.writeInt32LE(height, 8); // The bitmap height in pixels (signed integer)
    buf.writeUInt16LE(1, 12); // The number of color planes (must be 1)
    buf.writeUInt16LE(bpp, 14); // The number of bits per pixel
    buf.writeUInt32LE(0, 16); // The compression method being used.
    buf.writeUInt32LE(0, 20); // The image size.
    buf.writeInt32LE(0, 24); // The horizontal resolution of the image. (signed integer)
    buf.writeInt32LE(0, 28); // The vertical resolution of the image. (signed integer)
    buf.writeUInt32LE(0, 32); // The number of colors in the color palette, or 0 to default to 2n
    buf.writeUInt32LE(0, 36); // The number of important colors used, or 0 when every color is important; generally ignored.

    return buf;
};

const get_dir = (image_buffer: Buffer, width: number, offset: number) => {
    const buf = Buffer.alloc(16);
    const size = image_buffer.byteLength + 40;
    const bpp = 32;

    buf.writeUInt8(width, 0); // Specifies image width in pixels.
    buf.writeUInt8(width, 1); // Specifies image height in pixels.
    buf.writeUInt8(0, 2); // Should be 0 if the image does not use a color palette.
    buf.writeUInt8(0, 3); // Reserved. Should be 0.
    buf.writeUInt16LE(1, 4); // Specifies color planes. Should be 0 or 1.
    buf.writeUInt16LE(bpp, 6); // Specifies bits per pixel.
    buf.writeUInt32LE(size, 8); // Specifies the size of the image's data in bytes
    buf.writeUInt32LE(offset, 12); // Specifies the offset of BMP or PNG data from the beginning of the ICO/CUR file

    return buf;
};

const get_dib = (image_buffer: Buffer, width: number) => {
    const size = image_buffer.byteLength;
    const height = width;
    const and_map_row = get_row_stride(width);
    const and_map_size = and_map_row * height;
    const buf = Buffer.alloc(size + and_map_size);

    // xor map
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const location = (x + y * width) * 4;

            const r = image_buffer[location];
            const g = image_buffer[location + 1];
            const b = image_buffer[location + 2]
            const a = image_buffer[location + 3];

            const newColor = b | (g << 8) | (r << 16) | (a << 24);

            const pos = ((height - y - 1) * width + x) * 4;

            buf.writeInt32LE(newColor, pos);
        }
    }

    // and map. It's padded out to 32 bits per line
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const location = (x + y * width) * 4;

            const alpha = (image_buffer[location + 3]) > 0 ? 0 : 1;
            const bitNum = (height - y - 1) * width + x;

            // width per line in multiples of 32 bits
            const width32 =
                width % 32 === 0 ? Math.floor(width / 32) : Math.floor(width / 32) + 1;

            const line = Math.floor(bitNum / width);
            const offset = Math.floor(bitNum % width);
            const bitVal = alpha & 0x00000001;

            const pos = size + line * width32 * 4 + Math.floor(offset / 8) - 1;
            const newVal = buf.readUInt8(pos) | (bitVal << (7 - (offset % 8)));
            buf.writeUInt8(newVal, offset);
        }
    }

    return buf;
}

export const generate_favicons = async (avatar_url: string) => {
    const start = Date.now();

    const avatar_response = await fetch(avatar_url);
    const avatar = await avatar_response.buffer();

    const circle = sharp(Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
            <circle r="256" cx="256" cy="256" fill="white"/>
        </svg>`));

    const shadow = sharp(Buffer.from(`
        <svg width="525" height="525">
            <circle r="256" cx="260" cy="260" fill="rgba(0,0,0,.35)"/>
        </svg>`)).blur(5);

    const circle_avatar = await circle.composite([{ input: avatar, blend: 'in' }]).toBuffer();

    const android_icon = await shadow.composite([{ input: circle_avatar, gravity: 'northwest' }]).toBuffer();

    const promises: Promise<any>[] = [];

    promises.push(
        sharp(android_icon)
            .resize(512, 512)
            .png()
            .toFile(`${__dirname}/../assets/server/static/android-chrome-512x512.png`)
    );
    promises.push(
        sharp(android_icon)
            .resize(192, 192)
            .png()
            .toFile(`${__dirname}/../assets/server/static/android-chrome-192x192.png`)
    );

    promises.push(
        sharp(avatar)
            .resize(180, 180)
            .png()
            .toFile(`${__dirname}/../assets/server/static/apple-touch-icon.png`)
    );

    promises.push(
        sharp(avatar)
            .resize(32, 32)
            .png()
            .toFile(`${__dirname}/../assets/server/static/favicon-32x32.png`)
    );
    promises.push(
        sharp(avatar)
            .resize(16, 16)
            .png()
            .toFile(`${__dirname}/../assets/server/static/favicon-16x16.png`)
    );

    const favicon_images = await Promise.all(favicon_levels.map(async level => {
        return [level, await sharp(avatar).resize(level, level).ensureAlpha().raw().toBuffer()]
    }));

    const header = get_ico_header(favicon_images.length);
    const header_and_icon_dir = [header];
    const image_data_arr = [];

    let len = header.length;
    let offset = header.length + 16 * favicon_images.length;

    favicon_images.forEach(([width, image]) => {
        const dir = get_dir(image, width, offset);
        const bmp_info_header = get_bmp_info_header(width);
        const dib = get_dib(image, width);
        header_and_icon_dir.push(dir);
        image_data_arr.push(bmp_info_header, dib);
        len += dir.length + bmp_info_header.length + dib.length;
        offset += bmp_info_header.length + dib.length;
    });

    const favicon_buffer = Buffer.concat(header_and_icon_dir.concat(image_data_arr), len);

    promises.push(fs.promises.writeFile(`${__dirname}/../assets/server/static/favicon.ico`, favicon_buffer));

    const result = await Promise.all(promises);
    
    logger.info(`Server favicon images generated in ${Date.now() - start}ms`);

    return result;
};