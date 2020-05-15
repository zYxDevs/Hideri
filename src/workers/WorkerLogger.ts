import { levels } from '../types/LogLevels';

export type WorkerLogger = {
    [K in keyof typeof levels.levels]: (message: string, eat_errors?: boolean) => Promise<void>
};

interface WorkerLoggerInstance {
    [key: string]:  WorkerLogger[keyof WorkerLogger]
}

class WorkerLoggerInstance {
    constructor() {
        Object.keys(levels.levels).forEach(level => {
            this[level] = (message: string, eat_errors = false) => new Promise((resolve, reject) => {
                process.send({
                    type: 'log',
                    level: level,
                    message: message
                }, undefined, {}, (error) => {
                    if (error && !eat_errors) return reject();
                    resolve();
                });
            });
        });
    }
}

export const WorkerLogger = new WorkerLoggerInstance() as WorkerLogger;
