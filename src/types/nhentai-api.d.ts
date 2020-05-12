type BookTitle = {
    english: string
    japanese: string
    pretty: string
}

type APIPath = {
    book(bookID: number): string
    bookCover(mediaID: number, extension: string): string
    bookPage(mediaID: number, page: number, extension: string): string
    bookThumb(mediaID: number, page: number, extension: string): string
    search(query: string, page?: number): string
    searchAlike(bookID: number): string
    searchTagged(tagID: number, page?: number): string
}

type APIBook = {
    title: BookTitle
    id: number | string
    media_id: number | string
    num_favorites: number | string
    num_pages: number | string
    scanlator: string
    uploaded: number | string
    cover: APIImage
    images: APIImage[]
    tags: APITag[]
}

type APIImage = {
    t: string
    w: number | string
    h: number | string
}

type APISearch = {
    result: APIBook[]
    num_pages: number | string
    per_page: number | string
}

type APITag = {
    id: number | string
    type: string
    name: string
    count: number | string
    url: string
}

type ImageType = {
    extension: string | null
    isKnown: boolean
    knownTypes: ImageTypes
    type: string | null
}

type ImageTypes = {
    [key: string]: ImageType
}

type TagType = {
    type: string | null
    isKnown: boolean
    knownTypes: TagTypes
}

type TagTypes = {
    [key: string]: TagType
}

declare module 'nhentai-api' {
    class API {
        private APIPath: APIPath;
        net: any;

        private getAPIArgs(hostType: string, api: string): {
            host: string,
            apiPath: Function
        }
        getBook(bookID: number): Promise<Book>
        getImageURL(image: Image): string
        getThumbURL(image: Image): string
        request<T>(options: {
            host: string,
            path: string
        }): T
        search(query: string, page?: number): Promise<Search>
        searchAlike(book: Book | number): Promise<Search>
        searchTagged(tag: number | Tag): Promise<Search>
    }
    class Book {
        cover: Image;
        favorites: number;
        id: number;
        isKnown: boolean;
        media: number;
        pages: Image[];
        title: BookTitle;
        uploaded: Date;

        static parse(book: APIBook): Book
        hasTag(tag: Tag, strict?: boolean): boolean
        hasTagWith(tag: Tag): boolean

        private pushPage(page: Image): boolean
        private pushTag(tag: Tag): boolean
        private setCover(cover: Image): boolean
    }
    class Image {
        book: Book
        filename: string
        height: number
        id: number
        isCover: boolean
        type: ImageType
        static types: ImageTypes
        width: number

        static parse(image: APIImage, id?: number): Image
    }
    class Search {
        books: Book[]
        page: number
        pages: number
        perPage: number

        static parse(search: APISearch): Search
        private pushBook(book: Book): boolean
    }
    class Tag {
        static types: TagTypes
        static get(tag: APITag | Tag): Tag
        compare(tag: string | Tag, strict?: boolean): boolean
    }
}
