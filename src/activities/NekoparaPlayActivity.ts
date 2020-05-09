import { BaseActivity } from './BaseActivity';
import { RandomUtils } from '../utils/RandomUtils';
import { PresenceStatusData } from 'discord.js';

export class NekoparaPlayActivity extends BaseActivity {
    public async create() {
        this.user.setPresence({
            status: RandomUtils.choice<PresenceStatusData>(['online', 'idle', 'dnd']),
            activity: {
                name: `Nekopara ${RandomUtils.choice([
                    'vol. 0',
                    'vol. 1',
                    'vol. 2',
                    'vol. 3',
                    'Extra'
                ])} | <h`,
                type: 'PLAYING'
            }
        })
    }
}
