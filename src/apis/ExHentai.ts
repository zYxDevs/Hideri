import ExAPI, { GalleryToken, ThumbnailsType, EHGallery, ViewToken } from 'exapi';
import { CappedMap } from '../utils/CappedMap';
import { create_logger } from '../utils/Logger';

const logger = create_logger(module);

export class ExHentai extends ExAPI {
    private static gallery_cache = new CappedMap<string, EHGallery>(1000);
    private static image_cache = new CappedMap<string, string>(1000);

    public async getGalleryInfo(gallery: GalleryToken, thumbnails_type: ThumbnailsType = ThumbnailsType.NORMAL) {
        const cache_key = `${gallery.join('/')}:${thumbnails_type}`;
        if (ExHentai.gallery_cache.has(cache_key)) {
            logger.verbose(`cache hit: gallery ${cache_key}`);

            return ExHentai.gallery_cache.get(cache_key);
        }

        logger.verbose(`cache miss: gallery ${cache_key}`);

        const gallery_info = await super.getGalleryInfo(gallery, thumbnails_type);
        ExHentai.gallery_cache.set(cache_key, gallery_info);

        return gallery_info;
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