import path from 'path';
import logging from '../configs/logging.json';
import fs from 'fs';
import { WorkerLogger as logger } from './WorkerLogger';

const writeFile = fs.promises.writeFile;

export const create_handler = () => {
    process.on('uncaughtException', async error => {
        const filename = path.join(__dirname, '..', logging.log_dir, `error-${Date.now()}.stacktrace`);
    
        process.send({
            type: 'error',
            message: `${error.name}: ${error.message}`
        })
    
        await logger.fatal(`uncaught error ${error.stack}`, true);
        await logger.fatal(`thread is now in inconsistent state and cannot continue. exiting`);
        await logger.fatal(`full stacktrace has been written to ${filename}`);
        await writeFile(filename, error.stack);
        process.exit(1);
    });
    
    process.on('unhandledRejection', async reason => {
        process.send({
            type: 'error',
            message: reason instanceof Error ? `${reason.name}: ${reason.message}` : reason 
        });
    
        if (reason instanceof Error) {
            const filename = path.join(__dirname, '..', logging.log_dir, `error-${Date.now()}.stacktrace`);
    
            await logger.error(`uncaught promise rejection ${reason.stack}`, true);
            logger.error(`full stacktrace has been written to ${filename}`);
            writeFile(filename, reason.stack);
        } else {
            await logger.error(`uncaught promise rejection ${reason}`, true);
        }
    });
    
};