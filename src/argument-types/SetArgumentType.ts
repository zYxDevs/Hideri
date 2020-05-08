import { CustomArgumentType } from './CustomArgumentType';
import { StringUtils } from '../utils/StringUtils';

export class SetArgumentType extends CustomArgumentType {
    public argument_list: string[] = [];
    public case_sensitive = false;
    public optional = false;

    public validate_argument() {
        if (this.case_sensitive) return this.argument_list.includes(this.arg);
        return StringUtils.ci_includes(this.argument_list, this.arg);
    }

    public get_usage() {
        return (this.optional ? '<' : '[') + this.argument_list.join('|\u200b') + (this.optional ? '>' : ']');
    }
}