import { ArgsOf, Client } from '@typeit/discord';

export function Not(func: Function) {
    return ([message]: ArgsOf<'message'>, client: Client) => !func([message], client)
}