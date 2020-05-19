import { BaseActivity } from './BaseActivity';
import { RandomUtils } from '../utils/RandomUtils';
import { PresenceStatusData } from 'discord.js';

export class TrapPlayActivity extends BaseActivity {
    public async create() {
        this.user.setPresence({
            status: RandomUtils.choice<PresenceStatusData>(['dnd', 'idle', 'online']),
            activity: {
                name: RandomUtils.choice([
                    'Josou Kaikyou',
                    'Josou Gauken',
                    'Josou Jinja',
                    'Josou Sanmyaku',
                    'Josou Sennen Oukoku',
                    'Otomaid @ Cafe',
                    'School Idol QT Cool'
                ]) + ' | <h',
                type: 'PLAYING'
            }
        })
    }
}
