import { HAnimeAPI, HAnimeVideo, APIShortVideoInfo } from 'hanime';
import { CappedMap } from '../utils/CappedMap';

export class HAnime extends HAnimeAPI {
    private static video_cache = new CappedMap<string, HAnimeVideo>(1000);

    public async get_video(video: APIShortVideoInfo | string) {
        const slug = typeof video == 'string' ? video : video.slug;

        if (HAnime.video_cache.has(slug)) return HAnime.video_cache.get(slug);

        const video_result = await super.get_video(video);
        HAnime.video_cache.set(slug, video_result);
        
        return video_result;
    }
}