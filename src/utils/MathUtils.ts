export abstract class MathUtils {
    public static clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    }
}