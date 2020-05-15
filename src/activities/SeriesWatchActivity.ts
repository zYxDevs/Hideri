import { BaseActivity } from './BaseActivity';
import { RandomUtils } from '../utils/RandomUtils';

export class SeriesWatchActivity extends BaseActivity {
    public async create() {
        this.user.setPresence({
            status: RandomUtils.choice(['dnd', 'idle', 'online']),
            activity: {
                name: (Math.random() > .97 ? 'Boku no Pico' : RandomUtils.choice([
                    'Nekopara',
                    'MILF Isekai',
                    'Itadaki! Seieki',
                    'Shoujo Ramune',
                    'Oni Chichi',
                    'Futabu',
                    'Ecchi',
                    'hanime.tv',
                    'HentaiHaven'
                ])) + ' | <h',
                type: 'WATCHING'
            }
        })
    }
}