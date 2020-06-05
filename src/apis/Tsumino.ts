import fetch from 'node-fetch';
import formurlencoded from 'form-urlencoded';
import cheerio from 'cheerio';
import url from 'url';

type SearchResultListing<T> = {
    historyPage: number,
    impression: string,
    entry: {
        collectionPosition: number,
        duration: number,
        entryType: T,
        filledOpinion: string,
        id: number,
        rating: number,
        thumbnailTemplateUrl: string,
        thumbnailUrl: string,
        title: string
    }
};

type SearchResult<T> = {
    pageCount: number,
    pageNumber: number,
    data: SearchResultListing<T>[]
};

const default_options = {
    PageNumber: 1,
    Sort: 'Newest',
    List: 0,
    Length: 0,
    MinimumRating: 0,
    ExcludeList: 0,
    CompletelyExcludeHated: false
};

type SearchRequest = { [P in keyof typeof default_options]?: (typeof default_options)[P] } & {
    Tags?: {
        Id: number,
        Type: number,
        Text: string,
        Exclude: boolean
    }[]
};

type EntryType = 'Book' | 'Video';

type EntryTypes = {
    'Book': Book,
    'Video': Video
};

interface Entry {
    title: string,
    uploader: string[],
    uploaded: string,
    parody: string[],
    tags: string[],
    rating: number,
    thumbnail_url: string,
    url: string,
    id: number
};

export interface Video extends Entry {
    collection: string[],
    duration: number,
};

export interface Book extends Entry {
    category: string[],
    group: string[],
    pages: number,
    key: string,
    expires: string
};

export class Book {
    public get_page_url(page: number) {
        return `https://content.tsumino.com/parts/${this.id}/${page}?key=${this.key}&expires=${this.expires}`;
    }
}

export class Video {}

export class Tsumino {
    public async search<T extends EntryType = 'Book'>(query: string, type: T = ('Book' as any), options?: SearchRequest): Promise<SearchResult<T>> {
        options = Object.assign({}, default_options, options);

        // TODO: auto-tagging

        const response = await fetch(`https://www.tsumino.com/Search/Operate/?type=${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: formurlencoded(options)
        });

        return response.json();
    }

    public async get_entry<T extends EntryType>(id: number | SearchResultListing<T>): Promise<T extends void ? Entry : EntryTypes[T]> {
        if (typeof id !== 'number') id = id.entry.id;

        const response = await fetch(`https://www.tsumino.com/entry/${id}`);

        if (response.status !== 200) return null;

        const $ = cheerio.load(await response.text());

        const thumbnail_url = $('.book-page-cover img').first().attr('src');

        let entry: Entry = new Book();

        if (!thumbnail_url) entry = new Video();

        const result: any = {
            url: `https://www.tsumino.com/entry/${id}`,
            tags: $('#Tag .book-tag').map((i, x) => x.attribs['data-define']).toArray(),
            title: $('#Title').text().trim(),
            uploader: $('#Uploader .book-tag').map((i, x) => $(x).text().trim()).toArray(),
            uploaded: $('#Uploaded').text().trim(),
            parody: $('#Parody .book-tag').map((i, x) => x.attribs['data-define']).toArray(),
            rating: $('#Rating').text().trim(),
            id: id
        };

        if (entry instanceof Book) {
            result.thumbnail_url = thumbnail_url;
            result.category = $('#Category .book-tag').map((i, x) => x.attribs['data-define']).toArray();
            result.group = $('#Group .book-tag').map((i, x) => x.attribs['data-define']).toArray();
            result.pages = +$('#Pages').text();

            const page_viewer = await fetch(`https://www.tsumino.com/Read/Index/${id}?page=1`);
            const $$ = cheerio.load(await page_viewer.text());

            const query = url.parse($$('#image-container')[0].attribs['data-cdn'], true).query;

            result.key = query.key;
            result.expires = query.expires;
        } else {
            result.thumbnail_url = `https://content.tsumino.com/videos/${id}/thumbnail.png`;
            result.collection = $('#Collection .book-tag').map((i, x) => x.attribs['data-define']).toArray();
            result.duration = parseInt($('#Duration').text());
        }

        Object.assign(entry, result);

        return entry as any;
    }
}
