export abstract class CustomArgumentType {
    public optional = false;
    public default;

    constructor(public arg: string) {}
    abstract validate_argument(): boolean;
    abstract get_usage(): string;
    public get() { return this.arg ?? this.default; }
}