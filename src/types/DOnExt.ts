import { DOn } from '@typeit/discord';
import { CommandGroup } from './CommandGroup';

export type DOnExt = {
    infos?: string,
    description?: string,
    commandName: string,
    group: CommandGroup,
    usage: string,
    hide?: boolean,
    aliases?: string[]
};
