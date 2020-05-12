import { API, Book } from 'nhentai-api';
import { CappedMap } from '../utils/CappedMap';

export class NHentai extends API {
    private static cache = new CappedMap<number, Book>(1000);

    public async getBook(bookID: number) {
        if (NHentai.cache.has(bookID)) return NHentai.cache.get(bookID);

        const book = await super.getBook(bookID);
        NHentai.cache.set(bookID, book);

        return book;
    }

    public async search(query: string, page?: number) {
        const results = await super.search(query, page);

        results.books.forEach(book => {
            if (NHentai.cache.has(book.id)) return;
            NHentai.cache.set(book.id, book);
        });

        return results;
    }
}