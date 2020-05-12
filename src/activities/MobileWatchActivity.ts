import { BaseActivity } from './BaseActivity';
import { Client as DiscordJSClient, Base } from 'discord.js';
import config from '../configs/config.json';

export class MobileWatchActivity extends BaseActivity {
    private mobile_client = new DiscordJSClient({
        ws: {
            properties: {
                '$browser': 'Discord Android'
            }
        } as any
    });

    public async create() {
        await this.mobile_client.login(config.token);
        this.user.setActivity(null);
        this.mobile_client.user.setActivity({
            name: 'hentai | <h',
            type: 'WATCHING'
        });
    }

    public async destroy() {
        this.mobile_client.destroy();
    }
}
