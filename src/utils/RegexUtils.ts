export abstract class RegexUtils {
    public static escape(string: string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}