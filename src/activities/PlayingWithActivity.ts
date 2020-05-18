import { BaseActivity } from './BaseActivity';
import { RandomUtils } from '../utils/RandomUtils';

export class PlayingWithActivity extends BaseActivity {
    public async create() {
        this.user.setPresence({
            status: RandomUtils.choice(['dnd', 'idle', 'online']),
            activity: {
                name: 'with ' + RandomUtils.choice([
                    'Astolfo',
                    'Felix Argyle',
                    'Totsuka Saika',
                    'Ruka Urushibara',
                    'Hime Arikawa'
                ]) + RandomUtils.choice([
                    '',
                    ' in bed'
                ]) + ' | <h',
                type: 'PLAYING'
            }
        })
    }
}