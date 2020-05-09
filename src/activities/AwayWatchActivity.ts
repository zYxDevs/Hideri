import { BaseActivity } from './BaseActivity';
import { RandomUtils } from '../utils/RandomUtils';

export class AwayWatchActivity extends BaseActivity {
    public async create() {
        this.user.setPresence({
            status: RandomUtils.choice(['dnd', 'idle']),
            activity: {
                name: 'hentai | <h',
                type: 'WATCHING'
            }
        })
    }
}
