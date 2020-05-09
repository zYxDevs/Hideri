import { BaseActivity } from './BaseActivity';

export class GenericHelpActivity extends BaseActivity {
    public async create() {
        this.user.setActivity({
            name: '<h for help',
            type: 'PLAYING'
        });
    }
}