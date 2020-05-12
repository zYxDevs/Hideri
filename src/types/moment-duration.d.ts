type Settings = {
    template?: string | Function,
    precision?: number,
    trim: boolean
}

declare namespace moment {
    interface Duration {
        format(settings: Settings): string
        format(template: string | Function, settings: Settings): string
        format(template: string | Function, precision?: number, settings?: Settings): string
    }
}
