import { fork } from 'child_process';
import { ServerHandlerCommand } from '../types/ServerHandlerCommand';

export abstract class ServerHandler {
    public static server = fork(`${__dirname}/server.js`, [], {
        stdio:  [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    });

    public static set_client_id(id: string) {
        this.server.send(JSON.stringify({
            command: ServerHandlerCommand.SET_CLIENT_ID,
            data: id
        }));
    }

    public static set_cache_dir(dir: string) {
        this.server.send(JSON.stringify({
            command: ServerHandlerCommand.SET_CACHE_DIR,
            data: dir
        }));
    }
}