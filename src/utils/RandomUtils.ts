export class RandomUtils {
    public static randint(minimum: number, maximum: number) {
        return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    }
    public static choice(array: Array<any>) {
        return array[Math.floor(Math.random() * array.length)];
    }
}