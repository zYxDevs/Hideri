import { Client } from '@typeit/discord';

export abstract class BaseActivity {
    constructor(public client: Client) { }

    get user() { return this.client.user }

    public async create() {};
    public async destroy() {};
}
