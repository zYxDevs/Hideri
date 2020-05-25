declare module 'exapi' {
    interface ApiCookies {
        ipb_member_id: string,
        ipb_pass_hash: string,
        igneous: string
    }

    interface SearchConfig {
        type: GalleryType[],
        tag?: { [T in TagNamespace]?: string[] },
        text?: string
    }

    type GalleryToken = [string, string];
    type ViewToken = [string, string];

    type TagNamespace =
        'language' |
        'parody' |
        'character' |
        'group' |
        'artist' |
        'male' |
        'female' |
        'misc' |
        'reclass';

    type GalleryType =
        'Doujinshi' |
        'Manga' |
        'Artist CG' |
        'Game CG' |
        'Western' |
        'Non-H' |
        'Image Set' |
        'Cosplay' |
        'Asian Porn' |
        'Misc'

    type PartialGalleryInfo = {
        type: string,
        title: string,
        cover?: string,
        published: string,
        rating: number,
        length: number,
        uploader: string,
        href: GalleryToken
    }

    type GalleryInfo = {
        type: string,
        title: [string] | [string, string],
        cover: string,
        uploader: string,
        published: string,
        parent: string,
        visible: string,
        language: string,
        size: string,
        length: number,
        favorited: number,
        rating: {
            count: number,
            average: number
        },
        tag: { [T in TagNamespace]?: string[] }
    };

    type Comment = {
        isUploader: boolean,
        user: string,
        time: number,
        score: number,
        text: string
    }

    const enum ThumbnailsType {
        NORMAL = 0,
        LARGE = 1
    }

    export default class {
        constructor(cookies: ApiCookies, proxy?: string)

        getIndex(page: number): Promise<EHIndex>
        getGalleryInfo(gallery: GalleryToken, thumbnails_type?: ThumbnailsType): Promise<EHGallery>
        getImgUrl(token: ViewToken): Promise<string>
        getImgUrl(tokens: ViewToken[]): Promise<string[]>
        search(search: string | SearchConfig): Promise<EHSearch>
    }

    class EHIndex {
        pages: number;

        getAll(): PartialGalleryInfo[]
    }

    class EHSearch extends EHIndex {
        page: number;

        next(advance?: number): Promise<this | null>
    }

    class EHGallery {
        _total: number;
        _page: number;
        _pages: number;

        getAllInfo(): GalleryInfo
        getInfo<T extends keyof GalleryInfo>(key?: T): GalleryInfo[T]
        getThumbnails(): string[]
        getViewHref(): ViewToken[]
        getComment(): Comment[]
        next(advance?: number): Promise<this | null>
    }
}