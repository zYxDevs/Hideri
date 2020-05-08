export class StringUtils {
    public static ci_get(dict: Object, search_key: string, options = { fuzzy: true }) {
        const confidence_map = new Map<number, any>();
        for (let key in dict) {
            if (!options.fuzzy) {
                if (key.toLowerCase() == search_key.toLowerCase()) return dict[key];
            } else {
                if (key.toLowerCase().startsWith(search_key.toLowerCase())) {
                    const confidence = search_key.length / key.length;
                    if (confidence <= .66) continue;
                    if (confidence == 1) return dict[key];
                    
                    confidence_map.set(confidence, dict[key]);
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