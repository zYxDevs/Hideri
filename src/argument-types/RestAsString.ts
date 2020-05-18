import { RegexUtils } from '../utils/RegexUtils';

export class RestAsString {
    private val: string;

    constructor(private args: string[], private original_content: string) {
        const regex_dict = {};
        this.val = args.map(arg => {
            let regex: RegExp;
            if (arg in regex_dict) {
                regex = regex_dict[arg];
            } else {
                regex = new RegExp(`(.?)${RegexUtils.escape(arg)}(.?)`, 'g');
                regex_dict[arg] = regex;
            }

            const [ match, before, after ] = regex.exec(original_content) ?? [];

            if (!match) return arg;

            if (before == after) return match.trim();
            return arg;
        }).join(' ');
    }

    get() { return this.val }
}