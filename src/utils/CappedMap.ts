export class CappedMap<K, V> extends Map<K, V> {
    constructor(private max_size: number) {
        super();
    }

    public set(key: K, value: V) {
        super.set(key, value);

        if (this.size > this.max_size) {
            [...this.keys()].slice(0, this.max_size - this.size).forEach(key_to_delete => {
                this.delete(key_to_delete);
            })
        }

        return this;
    }
}