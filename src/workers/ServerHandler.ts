import { fork } from 'child_process';
import { ServerHandlerCommand } from '../types/ServerHandlerCommand';
import { create_logger } from '../utils/Logger';
import { IPCLoggingResponse } from '../types/IPCLoggingResponse';

const logger = create_logger(module);
const server_logger = create_logger('Server Thread')

export abstract class ServerHandler {
    public static server = fork(`${__dirname}/server.js`, [], {
        stdio:  [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    });

    public static set_client_id(id: string) {
        this.server.send({
            command: ServerHandlerCommand.SET_CLIENT_ID,
            data: id
        });
    }

    public static set_cache_dir(dir: string) {
        this.server.send({
            command: ServerHandlerCommand.SET_CACHE_DIR,
            data: dir
        });
    }
}

logger.info(`server thread started with PID ${ServerHandler.server.pid}`);

ServerHandler.server.on('message', (message: IPCLoggingResponse) => {
    message.type == 'log' && server_logger.log(message.level, message.message);
});