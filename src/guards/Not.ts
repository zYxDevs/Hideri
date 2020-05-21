import { GuardFunction } from '@typeit/discord';

export function Not(func: GuardFunction<'message'>): GuardFunction<'message'> {
    return ([message], client, next) => {
        let call_next = true;
        func([message], client, async () => { call_next = false });

        if (call_next) next();
    }
}