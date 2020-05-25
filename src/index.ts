import fs from 'fs';

try { console.log(fs.readFileSync(`${__dirname}/assets/header.txt`, 'utf8').toString()); } catch {}

import path from 'path';
import logging from './configs/logging.json';
import config from './configs/config.json';
import credentials from './configs/credentials.json';
import { AppDiscord } from "./AppDiscord";
import moment from 'moment-timezone';
import moment_duration_format from 'moment-duration-format';
import { create_logger } from './utils/Logger';
import { exec, execSync } from 'child_process';
import { MathUtils } from './utils/MathUtils';

const logger = create_logger('');
const writeFile = fs.promises.writeFile;

moment_duration_format(moment);

AppDiscord.start();

['SIGTERM', 'SIGINT'].forEach((signal: NodeJS.Signals) => {
    process.on(signal, () => {
        AppDiscord.destroy().finally(() => process.exit(0));
    })
});

let last_timeout;

const setup_proxy = (i = 0) => {
    clearTimeout(last_timeout);

    const ssh_config = (credentials as any).proxy;
    const keyfile = path.resolve(`${__dirname}/configs/${ssh_config.key}`);
    try {
        execSync(`chmod 600 ${keyfile}`);
    } catch (e) {
        logger.log('fatal', 'failed to set permission on key!');
        process.exit(2);
    }

    logger.info(`setting up ssh proxy`);
    const ssh = exec(`ssh -i "${keyfile}" -oStrictHostKeyChecking=no -p ${ssh_config.port} -D 1080 "${ssh_config.user}@${ssh_config.address}"`);
    ssh.on('close', code => {
        const next_delay = MathUtils.clamp(i * 100, 0, 60000);

        logger.error(`ssh process closed with code ${code}`);
        logger.error(`trying again in ${next_delay}ms`);
        last_timeout = setTimeout(() => i = 0, 61e3);

        setTimeout(() => setup_proxy(i + 1), next_delay);
    });
};

const exception_handler = async error => {
    const filename = path.join(__dirname, logging.log_dir, `error-${Date.now()}.stacktrace`);

    logger.log('fatal', `uncaught error ${error.stack}`);

    if (config.exit_on_uncaught_error) logger.log('fatal', `thread is now in inconsistent state and cannot continue. exiting`);

    logger.log('fatal', `full stacktrace has been written to ${filename}`);
    await writeFile(filename, error.stack);

    if (config.exit_on_uncaught_error) {
        process.exit(1);
    } else {
        logger.warn('bot is configured to not exit on uncaught exceptions. This is undefined behavior and may cause issues or corruption.');
    }
};

const rejection_handler = async reason => {
    if (reason instanceof Error) {
        const filename = path.join(__dirname, logging.log_dir, `error-${Date.now()}.stacktrace`);

        logger.error(`uncaught promise rejection ${reason.stack}`);
        logger.error(`full stacktrace has been written to ${filename}`);
        writeFile(filename, reason.stack);
    } else {
        logger.error(`uncaught promise rejection ${reason}`);
    }
};

process.on('uncaughtException', error => exception_handler(error).catch(() => {}));

process.on('unhandledRejection', reason => rejection_handler(reason).catch(() => {}));

if ((credentials as any).proxy && (credentials as any)?.proxy?.type == 'ssh') setup_proxy();   