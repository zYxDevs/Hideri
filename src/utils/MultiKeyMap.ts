export class MultiKeyMap<K, V> extends Map<K, V> {
    private multi_key_map = new Map<K, K>();
    private reverse_multi_key_map = new Map<K, K[]>();

    constructor(entries?: [K | K[], V][]) {
        super();

        entries?.forEach(([ key, value ]) => {
            if (!Array.isArray(key)) return this.set(key, value);

            const alias_keys = key.slice(1);

            alias_keys.forEach(multi_key => {
                this.multi_key_map.set(multi_key, key[0]);
            });

            this.reverse_multi_key_map.set(key[0], alias_keys);

            this.set(key[0], value);
        })
    }

    public keys() {
        const iterators = [super.keys(), this.multi_key_map.keys()];

        return (function*() {
            while (iterators.length) {
                const { value, done } = iterators[0].next();

                if (!done) {
                    yield value;
                } else {
                    iterators.shift();
                }
            }
        })();
    }

    public get(key: K) {
        if (this.multi_key_map.has(key)) return super.get(this.multi_key_map.get(key));

        return super.get(key);
    }

    public has(key: K) {
        return super.has(key) || this.multi_key_map.has(key);
    }

    public set(key: K, value: V) {
        if (this.multi_key_map.has(key)) return super.set(this.multi_key_map.get(key), value);

        return super.set(key, value);
    }

    public clear() {
        this.multi_key_map.clear();
        this.reverse_multi_key_map.clear();

        return super.clear();
    }

    public delete(key: K) {
        if (this.multi_key_map.has(key)) {
            const actual_key = this.multi_key_map.get(key);
            const reverse_map = this.reverse_multi_key_map.get(actual_key);

            if (reverse_map) {
                this.reverse_multi_key_map.set(actual_key, reverse_map.filter(alias_key => alias_key !== key));
            }

            return this.multi_key_map.delete(key);
        } else if (this.reverse_multi_key_map.has(key)) {
            const alias_keys = this.reverse_multi_key_map.get(key);
            this.reverse_multi_key_map.delete(key);

            if (alias_keys.length == 0) return super.delete(key);

            const new_key = alias_keys[0];
            const value = super.get(key);

            this.multi_key_map.delete(new_key);

            alias_keys.slice(1).forEach(alias_key => {
                this.multi_key_map.set(alias_key, new_key);
            });

            this.reverse_multi_key_map.set(new_key, alias_keys.slice(1));

            super.set(new_key, value);

            return super.delete(key);
        } else {
            return super.delete(key);
        }
    }
}