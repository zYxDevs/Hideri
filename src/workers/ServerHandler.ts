import { fork, ChildProcess } from 'child_process';
import { ServerHandlerCommand } from './ServerHandlerCommand';
import { create_logger } from '../utils/Logger';
import { IPCLoggingResponse } from '../types/IPCLoggingResponse';
import { Client } from '@typeit/discord';

const logger = create_logger(module);
const server_logger = create_logger('Server Thread')

export abstract class ServerHandler {
    public static server: ChildProcess;

    public static set_client(client: Client) {
        this.server.send({
            command: ServerHandlerCommand.SET_CLIENT_ID,
            data: client.user.id
        });

        this.server.send({
            command: ServerHandlerCommand.SET_CLIENT_AVATAR,
            data: client.user.avatarURL({
                format: 'png',
                size: 512
            })
        });

        this.server.send({
            command: ServerHandlerCommand.SET_CLIENT_USERNAME,
            data: client.user.username
        });
    }

    public static set_cache_dir(dir: string) {
        this.server.send({
            command: ServerHandlerCommand.SET_CACHE_DIR,
            data: dir
        });
    }
}

const setup_thread = () => {
    ServerHandler.server = fork(`${__dirname}/server.js`, [], {
        stdio:  [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    });

    ServerHandler.server.on('exit', code => {
        logger.error(`child thread exitied with code ${code}`);
        logger.error(`attempting to relaunch...`);
        setTimeout(() => setup_thread(), 100);
    });

    ServerHandler.server.on('message', (message: IPCLoggingResponse) => {
        message.type == 'log' && server_logger.log(message.level, message.message);
    });

    logger.info(`server thread started with PID ${ServerHandler.server.pid}`);
};

setup_thread();
