import { BaseActivity } from './BaseActivity';

export class StreamingActivity extends BaseActivity {
    public async create() {
        this.user.setActivity({
            name: 'hentai',
            url: 'https://www.twitch.tv/hentai',
            type: 'STREAMING'
        })
    }
}
