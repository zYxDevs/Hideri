import config from '../configs/config.json';
import image_proxying from '../configs/image_proxying.json';
import { AppDiscord } from '../AppDiscord';
import { TextChannel } from 'discord.js';
import fetch, { RequestInit } from 'node-fetch';
import { CappedMap } from '../utils/CappedMap';

export abstract class ImageUploadProxy {
    private static image_cache = new CappedMap<string, string>(1000);

    public async get_uploaded_or_proxied(url: string, options: {
        method: 'upload' | 'proxy',
        proxy_path?: string,
        fetch_options?: RequestInit
    }) {
        if (options.method == 'proxy') return `${config.server_url}${options.proxy_path}?${encodeURIComponent(url)}`;

        if (ImageUploadProxy.image_cache.has(url)) return ImageUploadProxy.image_cache.get(url);

        const upload_channel = await AppDiscord.client.channels.fetch(image_proxying.upload_channel) as TextChannel;

        const image = await fetch(url, options.fetch_options);

        const message = await upload_channel.send('', { files: [{ attachment: await image.buffer() }] });
        const image_url = message.attachments.first().url;

        ImageUploadProxy.image_cache.set(url, image_url);

        return image_url;
    }
}