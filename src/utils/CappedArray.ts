export class CappedArray<V> extends Array<V> {
    constructor(private max_length: number) {
        super(0);
    }

    push(...elements: V[]) {
        return this.unshift(...elements);
    }

    unshift(...elements: V[]) {
        const result = super.unshift(...elements);
        this.length = Math.min(this.length, this.max_length);
        return result;
    }
}