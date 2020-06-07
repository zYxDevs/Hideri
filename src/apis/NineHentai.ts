import { NineHentaiAPI, NineHentaiBook, APIBook } from '9hentai';
import { CappedMap } from '../utils/CappedMap';

export class NineHentai extends NineHentaiAPI {
    private static cache = new CappedMap<number, Promise<NineHentaiBook>>(1000);

    public get_book(book: APIBook): NineHentaiBook
    public get_book(book: number | string): Promise<NineHentaiBook>
    public get_book(book: number | string | APIBook) {
        if (typeof book == 'number' || typeof book == 'string') {
            const key = +book;

            if (NineHentai.cache.has(key)) return NineHentai.cache.get(key);

            const result = super.get_book(book);
            NineHentai.cache.set(key, result);

            return result;
        }

        return super.get_book(book);
    }
}