import { GuardFunction, DiscordEvents, ArgsOf, Client } from '@typeit/discord';

export function GuardToBoolean<T extends DiscordEvents>(func: GuardFunction<T>) {
    return (args: ArgsOf<T>, client: Client) => {
        let next_called = false;
        func(args, client, async () => next_called = true);
        return next_called;
    }
}