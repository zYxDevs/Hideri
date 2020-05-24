import ExAPI, { GalleryToken, ThumbnailsType, EHGallery, ViewToken } from 'exapi';
import { CappedMap } from '../utils/CappedMap';
import { create_logger } from '../utils/Logger';
import fetch from 'node-fetch';
import credentials from '../configs/credentials.json';

const logger = create_logger(module);

export class ExHentai extends ExAPI {
    private static gallery_cache = new CappedMap<string, EHGallery & { token: GalleryToken }>(1000);
    private static image_cache = new CappedMap<string, string>(1000);
    private static ehentai_cache = new CappedMap<string, boolean>(1000);

    public async isEHentai(gallery: GalleryToken) {
        const cache_key = gallery.join('/');

        if (ExHentai.ehentai_cache.has(cache_key)) return ExHentai.ehentai_cache.get(cache_key);

        const result = await fetch(`https://e-hentai.org/g/${gallery[0]}/${gallery[1]}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0',
                'Referer': 'https://e-hentai.org/',
                'Cookie': Object.entries(credentials.exhentai).map(([ key, value ]) => `${key}=${value};`).join('')
            }
        });

        ExHentai.ehentai_cache.set(cache_key, result.status == 200);

        return result.status == 200;
    }

    public async getGalleryInfo(gallery: GalleryToken, thumbnails_type: ThumbnailsType = ThumbnailsType.NORMAL): Promise<EHGallery & { token: GalleryToken }> {
        const cache_key = `${gallery.join('/')}:${thumbnails_type}`;
        if (ExHentai.gallery_cache.has(cache_key)) {
            logger.verbose(`cache hit: gallery ${cache_key}`);

            const cached_gallery = ExHentai.gallery_cache.get(cache_key);

            return Object.assign(Object.setPrototypeOf({}, Object.getPrototypeOf(cached_gallery)), cached_gallery);
        }

        logger.verbose(`cache miss: gallery ${cache_key}`);

        const gallery_info = Object.assign(await super.getGalleryInfo(gallery, thumbnails_type), {
            token: gallery
        });

        ExHentai.gallery_cache.set(cache_key, gallery_info);

        return Object.assign(Object.setPrototypeOf({}, Object.getPrototypeOf(gallery_info)), gallery_info);
    }

    public getImgUrl(token: ViewToken): Promise<string>;
    public getImgUrl(token: ViewToken[]): Promise<string[]>;
    public async getImgUrl(token: ViewToken | ViewToken[]) {
        if (Array.isArray(token[0])) {
            return Promise.all((token as ViewToken[]).map(t => this.getImgUrl(t)));
        }

        const cache_key = token.join('/');
        if (ExHentai.image_cache.has(cache_key)) {
            logger.verbose(`cache hit: image ${cache_key}`);

            return ExHentai.image_cache.get(cache_key);
        }

        logger.verbose(`cache miss: image ${cache_key}`);

        const image = await super.getImgUrl(token as ViewToken);
        ExHentai.image_cache.set(cache_key, image);

        return image;
    }
} 