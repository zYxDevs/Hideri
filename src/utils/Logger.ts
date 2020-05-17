import { createLogger, format, transports, level } from 'winston';
import logging from '../configs/logging.json';
import path from 'path';
import fs from 'fs';
import winston from 'winston/lib/winston/config';
import { levels } from '../types/LogLevels';

const { Console, File } = transports;
const {
    colorize,
    combine,
    timestamp,
    errors,
    printf,
    splat,
} = format;

const pretty_format_color = combine(
    format(info => {
        info.level = `${info.level.toUpperCase()}`;
        return info;
    })(),
    colorize(),
    timestamp(),
    splat(),
    errors(),
    printf(({ timestamp, level, message, source_module, ...rest }) => {
        let restString = JSON.stringify(rest, undefined, 2);
        restString = restString === '{}' ? '' : restString;

        let out = `[${timestamp}]`
        if (source_module) out += ` [${source_module}]`;
        out += ` [${level}]: ${message} ${restString}`;

        return out;
    })
);

const pretty_format = combine(
    format(info => {
        info.level = `${info.level.toUpperCase()}`;
        return info;
    })(),
    timestamp(),
    splat(),
    errors(),
    printf(({ timestamp, level, message, source_module, ...rest }) => {
        let restString = JSON.stringify(rest, undefined, 2);
        restString = restString === '{}' ? '' : restString;

        let out = `[${timestamp}]`
        if (source_module) out += ` [${source_module}]`;
        out += ` [${level}]: ${message} ${restString}`;

        return out;
    })
);

const log_transports = [];

const log_dir = `${__dirname}/../${logging.log_dir}/`;

if (!fs.existsSync(log_dir)) fs.mkdirSync(log_dir);

if (logging.console) {
    log_transports.push(new Console({
        format: pretty_format_color,
        level: logging.log_level
    }));
}

if (logging.combined_log) {
    log_transports.push(new File({
        filename: path.join(log_dir, logging.combined_log),
        format: pretty_format,
        level: logging.log_level
    }));

    if (logging.generate_json_logs) {
        log_transports.push(new File({
            filename: path.join(log_dir, logging.combined_log + '.json'),
            format: format.json(),
            level: logging.log_level
        }));
    }
}

if (logging.debug_log) {
    log_transports.push(new File({
        filename: path.join(log_dir, logging.debug_log),
        format: pretty_format,
        level: 'debug'
    }));

    if (logging.generate_json_logs) {
        log_transports.push(new File({
            filename: path.join(log_dir, logging.debug_log + '.json'),
            format: format.json(),
            level: 'debug'
        }));
    }
}

if (logging.error_log) {
    log_transports.push(new File({
        filename: path.join(log_dir, logging.error_log),
        format: pretty_format,
        level: 'error'
    }));

    if (logging.generate_json_logs) {
        log_transports.push(new File({
            filename: path.join(log_dir, logging.error_log + '.json'),
            format: format.json(),
            level: 'error'
        }));
    }
}

if (logging.info_log) {
    log_transports.push(new File({
        filename: path.join(log_dir, logging.info_log),
        format: pretty_format,
        level: 'info'
    }));

    if (logging.generate_json_logs) {
        log_transports.push(new File({
            filename: path.join(log_dir, logging.info_log + '.json'),
            format: format.json(),
            level: 'info'
        }));
    }
}

if (logging.http_log) {
    const http_only = format(info => info.level == 'http' ? info : false);

    log_transports.push(new File({
        filename: path.join(log_dir, logging.http_log),
        format: combine(http_only(), pretty_format),
        level: 'http'
    }));

    if (logging.generate_json_logs) {
        log_transports.push(new File({
            filename: path.join(log_dir, logging.http_log + '.json'),
            format: combine(http_only(), format.json()),
            level: 'http'
        }));
    }
}

const logger = createLogger({
    transports: log_transports,
    levels: levels.levels
});

winston.addColors(levels.colors);

export const create_logger = (source_module?: NodeModule | string) => {
    if (!source_module) return logger;
    if (typeof source_module != 'string' && 'filename' in source_module) source_module = path.basename(source_module.filename, path.extname(source_module.filename));
    return logger.child({
        source_module: source_module
    });
};