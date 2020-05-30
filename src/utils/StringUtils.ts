export class StringUtils {
    public static ci_get<T>(haystack: string[] | { [key: string]: T }, search_key: string, options = { fuzzy: true }) {
        const confidence_map = new Map<number, any>();

        for (let [key, value] of Object.entries(haystack)) {
            let needle: string = key;
            if (Array.isArray(haystack)) needle = value;

            if (!options.fuzzy) {
                if (needle.toLowerCase() == search_key.toLowerCase()) return value;
            } else {
                if (needle.toLowerCase().startsWith(search_key.toLowerCase())) {
                    const confidence = search_key.length / needle.length;
                    if (confidence <= .66) continue;
                    if (confidence == 1) return value;
                    
                    confidence_map.set(confidence, value);
                }
            }
        }

        const highest_confidence = Math.max(...confidence_map.keys());

        if (confidence_map.has(highest_confidence)) return confidence_map.get(highest_confidence);
    }

    public static ci_includes(array: Array<string>, search: string, options = { fuzzy: true }) {
        return array.some(val => {
            if (!options.fuzzy) return val.toLowerCase() == search.toLowerCase();
            if (options.fuzzy && val.toLowerCase().startsWith(search.toLowerCase())) return (search.length / val.length) > .66;
        });
    }
}