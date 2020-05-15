import { API, Book } from 'nhentai-api';
import { CappedMap } from '../utils/CappedMap';
import { create_logger } from '../utils/Logger';

const logger = create_logger(module);

export class NHentai extends API {
    private static cache = new CappedMap<number, Book>(1000);

    public async getBook(bookID: number) {
        if (NHentai.cache.has(bookID)) {
            logger.verbose(`cache hit: ${bookID}`);
            return NHentai.cache.get(bookID);
        }

        logger.verbose(`cache miss: ${bookID}`);

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