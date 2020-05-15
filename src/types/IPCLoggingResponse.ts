import { levels } from './LogLevels';

export type IPCLoggingResponse = {
    type: 'log',
    level: keyof typeof levels.levels,
    message: string
} | {
    type: 'error',
    message: string
};