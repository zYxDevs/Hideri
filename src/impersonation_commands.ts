import { RandomUtils } from './utils/RandomUtils';

export const IMPERSONATION_COMMANDS: {
    name?: string,
    info?: string,
    description?: string,
    aliases?: string[]
    text: string | Function,
}[] = [
    {
        name: "baka",
        info: "B-Baka!",
        text: "B-Baka! I-It’s Not like I like You!",
        description: "Makes someone a tsundere",
        aliases: [ 'tsundere' ]
    }, {
        name: "onii-chan",
        info: "Onii~~chan",
        description: "police are on their way",
        text: () => RandomUtils.choice([
            'Y-yamete, onii-chan!',
            'Yamete onii-chan!',
            'Onii-chan, what are you doing?',
            'Onii~~chan!',
            'Onii-chan!!'
        ]),
        aliases: [ 'onii', 'oniichan' ]
    }
];
