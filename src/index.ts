import fs from 'fs';

console.log(fs.readFileSync(`${__dirname}/assets/header.txt`, 'utf8').toString());

import path from 'path';
import logging from './configs/logging.json';
import { AppDiscord } from "./AppDiscord";
import moment from 'moment';
import moment_duration_format from 'moment-duration-format';
import { create_logger } from './utils/Logger';

const logger = create_logger('');
const writeFile = fs.promises.writeFile;

moment_duration_format(moment);

AppDiscord.start();

['SIGTERM', 'SIGINT'].forEach((signal: NodeJS.Signals) => {
    process.on(signal, () => {
        AppDiscord.destroy().finally(() => process.exit(0));
    })
});

process.on('uncaughtException', async error => {
    const filename = path.join(__dirname, logging.log_dir, `error-${Date.now()}.stacktrace`);

    logger.log('fatal', `uncaught error ${error.stack}`);
    logger.log('fatal', `thread is now in inconsistent state and cannot continue. exiting`);
    logger.log('fatal', `full stacktrace has been written to ${filename}`);
    await writeFile(filename, error.stack);
    process.exit(1);
});

process.on('unhandledRejection', async reason => {
    if (reason instanceof Error) {
        const filename = path.join(__dirname, '..', logging.log_dir, `error-${Date.now()}.stacktrace`);

        logger.error(`uncaught promise rejection ${reason.stack}`);
        logger.error(`full stacktrace has been written to ${filename}`);
        writeFile(filename, reason.stack);
    } else {
        logger.error(`uncaught promise rejection ${reason}`);
    }
});