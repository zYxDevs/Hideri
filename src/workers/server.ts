import config from '../configs/config.json';
import fetch, { RequestInit } from 'node-fetch';
import express, { Response, Request, RequestHandler } from 'express';
import mime from 'mime-types';
import slugify from 'slugify';
import fs from 'fs';
import { ServerHandlerCommand } from './ServerHandlerCommand';
import path from 'path';
import FileType from 'file-type';
import sharp from 'sharp';
import compression from 'compression';
import { create_handler } from './WorkerErrorHandler';
import { WorkerLogger as logger } from './WorkerLogger';
import memory_cache from 'memory-cache';
import { generate_favicons } from './generate-favicons';

const app = express();

const writeFile = fs.promises.writeFile
const readFile = fs.promises.readFile;
const access = fs.promises.access;
const mkdir = fs.promises.mkdir;

let cache_path = '';
let client_id = '';
let avatar_url = '';
let username = '';

const get_mime_type = async (file: Buffer | string) => {
    if (typeof file == 'string' && path.extname(file)) {
        const mime_type = mime.lookup(file);
        if (mime_type) return mime_type;
    }

    if (typeof file == 'string') return await FileType.fromFile(file);

    return await FileType.fromBuffer(file);
};

const serve_proxied_image = async (request: Request, response: Response<any>, url: string, fetch_options?: RequestInit) => {
    if (request.headers["if-modified-since"] || request.headers["if-none-match"]) {
        return response.sendStatus(304);
    }

    const key = slugify(url, {
        remove: /(^https?:\/\/)|([\?#].*$)/g,
        lower: true
    });

    const filepath = path.join(cache_path, key);

    const file_exists = await (access(filepath).then(() => true).catch(() => false));

    if (file_exists) {
        logger.verbose(`cache hit: ${url}`);

        response.setHeader('Content-Type', await get_mime_type(filepath));
        return response.end(await readFile(filepath));
    }

    logger.verbose(`cache miss: ${url}`);

    const image = await fetch(url, fetch_options);

    if (image.status >= 400) return response.sendStatus(image.status);

    let data = await image.buffer();

    ['Expires', 'Cache-Control', 'Last-Modified'].forEach(header => {
        if (image.headers.has(header)) response.setHeader(header, image.headers.get(header));
    });

    if (image.headers.has('Content-Type') && image.headers.get('Content-Type').startsWith('image/')) {
        response.setHeader('Content-Type', image.headers.get('Content-Type'));
    } else {
        response.setHeader('Content-Type', await get_mime_type(data));
    }

    if (image.headers.has('Content-Length')) {
        const length = +image.headers.get('content-length');
        if (length > .75e6) {
            const start = Date.now();
            data = await sharp(data).resize(1080, 1080, {
                fit: 'inside'
            }).toBuffer();
            logger.verbose(`image resized after ${Date.now() - start}ms`);
        }
    }

    response.end(data);

    await mkdir(path.dirname(filepath), { recursive: true });

    writeFile(filepath, data, 'binary');
};

const cache = (seconds?: number): RequestHandler => (request, response, next) => {
    const url = request.originalUrl ?? request.url;
    const body_key = `__express__${url}`;
    const status_key = `__express__status_${url}`;
    const content_type_key = `__express__content_type_${url}`;
    const body = memory_cache.get(body_key);
    const status = memory_cache.get(status_key);
    const content_type = memory_cache.get(content_type_key);
    
    if (body) {
        logger.verbose(`memory cache hit: ${url}`);

        if (status) response.statusCode = status;
        if (content_type) response.setHeader('Content-Type', content_type);

        return response.send(body);
    }

    const original_send = response.send;

    response.send = body => {
        if (response.statusCode < 300) {
            const duration = seconds ? seconds * 1000 : undefined;

            memory_cache.put(body_key, body, duration);
            memory_cache.put(status_key, response.statusCode, duration);
            memory_cache.put(content_type_key, response.getHeader('Content-Type'), duration);
        }

        return original_send.call(response, body);
    };

    next();
};

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    const source = req.headers['x-forwarded-for'].toString() ?? req.connection.remoteAddress;
    if (source.endsWith('127.0.0.1') && !logging.server_log_loopback) return next();
    logger.http(`[${source}]: ${req.method.toUpperCase()} ${req.url}`);
    next();
}, cache(300), compression(), express.static(`${__dirname}/../assets/server/static`));

app.get(['/', '/index.html'], cache(), (request, response) => {
    response.render(`${__dirname}/../assets/server/views/index`, {
        username: username,
        invite_link: `https://discord.com/oauth2/authorize?client_id=${client_id}&scope=bot&permissions=640928832`,
        color: config.color || '#ffffff'
    });
});

app.get('/site.webmanifest', cache(), (request, response) => {
    response.render(`${__dirname}/../assets/server/views/site-webmanifest`, {
        username: username,
        color: config.color || '#ffffff'
    });
});

app.get('/images/avatar.png', (request, response) => {
    response.redirect(avatar_url);
});

app.get('/hitomila/*', async (request, response) => {
    const url = request.url.replace(/^\/hitomila\//g, '');

    if (!/^https?:\/\/\w{2}\.hitomi\.la\/(?:images|webp)\//.test(url)) {
        return response.redirect('/');
    }

    serve_proxied_image(request, response, url, {
        headers: {
            'referer': 'https://hitomi.la/reader/123.html'
        }
    });
});

app.get('*', (request, response) => {
    response.redirect('/');
});

app.listen(config.port);

logger.http(`listening on port ${config.port}`);

process.on('message', async message => {
    const { command, data } = message;

    switch (command) {
        case ServerHandlerCommand.SET_CACHE_DIR:
            cache_path = data;

            access(cache_path).catch(() => {
                fs.mkdir(cache_path, () => {});
            })

            break;
        
        case ServerHandlerCommand.SET_CLIENT_ID:
            client_id = data;
            break;

        case ServerHandlerCommand.SET_CLIENT_AVATAR:
            avatar_url = data;
            access(`${__dirname}/../assets/server/last_avatar`).catch(() => false).then(async res => {
                if (!res) {
                    generate_favicons(avatar_url);
                } else {
                    const last_avatar = await readFile(`${__dirname}/../assets/server/last_avatar`);
                    
                    if (last_avatar.toString() != avatar_url) generate_favicons(avatar_url);
                }

                writeFile(`${__dirname}/../assets/server/last_avatar`, avatar_url)
            });

            break;
        
        case ServerHandlerCommand.SET_CLIENT_USERNAME:
            username = data;
    }
});

create_handler();
