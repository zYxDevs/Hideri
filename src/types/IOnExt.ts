import { IOn } from '@typeit/discord';
import { CommandGroup } from './CommandGroup';

export type IOnExt = IOn & { group?: CommandGroup, usage?: string, hide?: boolean, aliases?: string[] };
