import { DOn } from '@typeit/discord';
import { CommandGroup } from './CommandGroup';

export type DOnExt = DOn & { group?: CommandGroup, usage?: string, hide?: boolean, aliases?: string[] };
