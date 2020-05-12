import { DiscordEvent, On as DiscordOn } from '@typeit/discord';

export function On(event: DiscordEvent) {
    return (target: Object, key: string, descriptor?: PropertyDescriptor) => {
        const original_method = descriptor.value;
        descriptor.value = (...args) => {
            if (!args[0]?.channel) return original_method(...args);
            try {
                const result = original_method(...args);
                if (result instanceof Promise) {
                    return result.finally(() => args[0]?.channel?.stopTyping());
                } else {
                    args[0]?.channel?.stopTyping();
                    return result;
                }
            } catch {
                args[0]?.channel?.stopTyping();
            }
        }
        DiscordOn(event)(target, key, descriptor);
    }
}
