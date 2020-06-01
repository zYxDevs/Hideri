import Sagiri, { SagiriResult } from 'sagiri';
import { CappedMap } from '../utils/CappedMap';

export const sagiri: typeof Sagiri = (token, options) => {
    const client = Sagiri(token, options);

    const cache = new CappedMap<string, SagiriResult[]>(1000);

    return async (file, options_override) => {
        const key = file + (JSON.stringify(options_override) ?? '');

        if (cache.has(key)) return cache.get(key);

        const result = await client(file, options_override);
        cache.set(key, result);

        return result;
    }
}