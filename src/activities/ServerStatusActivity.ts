import { BaseActivity } from './BaseActivity';

export class ServerStatusActivity extends BaseActivity {
    public async create() {
        this.user.setActivity({
            name: `Serving ${this.client.guilds.cache.size} servers | <h`,
            type: 'PLAYING'
        })
    }
}
