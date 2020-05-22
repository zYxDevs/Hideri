import { fork, ChildProcess } from 'child_process';
import { create_logger } from '../utils/Logger';
import { IPCLoggingResponse } from '../types/IPCLoggingResponse';
import image_processing from '../configs/image_processing.json';
import { AppDiscord } from '../AppDiscord';

type ImageIPCOptions = {
    image_location: string,
    mask_location: string,
    fonts?: string[],
    mime?: string,
    frame: {
        x: number,
        y: number,
        width: number,
        height: number,
        rot: number
    },
    segments: ({ type: 'text', data: string } | { type: 'image', data: string })[],
    emojis: string[]
};

type ImageResponse = {
    type: 'Buffer',
    data: number[]
} | IPCLoggingResponse;

export const enum ImageProcessingErrorMessage {
    TIMED_OUT = 'image processing timed out',
    QUEUE_FULL = 'image processing queue full'
}

export class ImageProcessingError extends Error {
    constructor(public message: ImageProcessingErrorMessage) { super(message); }
}

const logger = create_logger(module);
const image_processor_logger = create_logger('Image Processing Thread');

export abstract class ImageProcessorHandler {
    public static pending_requests: {
        resolve: Function,
        reject: Function,
        options: ImageIPCOptions
    }[] = [];
    public static image_processor: ChildProcess;
    
    public static process(options: ImageIPCOptions): Promise<{ data: number[] }> {
        let promise_resolve: Function;
        let promise_reject: Function;
        const promise = new Promise<{ data: number[] }>((resolve, reject) => [promise_resolve, promise_reject] = [resolve, reject]);

        if (this.pending_requests.length >= image_processing.queue_size) {
            promise_reject(new ImageProcessingError(ImageProcessingErrorMessage.QUEUE_FULL));
            return promise;
        }

        const request_object = {
            resolve: promise_resolve,
            reject: promise_reject,
            options: options
        };

        this.pending_requests.push(request_object);

        if (this.pending_requests.length == 1) {
            this.image_processor.send(options);
        }

        AppDiscord.client.setTimeout(() => {
            const index = this.pending_requests.indexOf(request_object);
            if (index == -1) return;

            promise_reject(new ImageProcessingError(ImageProcessingErrorMessage.TIMED_OUT));
            this.pending_requests.splice(index, 1);
        }, image_processing.processing_timeout * 1000);

        return promise;
    }
}

const setup_thread = () => {
    ImageProcessorHandler.image_processor = fork(`${__dirname}/image-processor.js`, [], {
        stdio:  [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    });

    ImageProcessorHandler.image_processor.on('exit', code => {
        logger.error(`child thread exitied with code ${code}`);
        logger.error(`attempting to relaunch...`);
        setTimeout(() => setup_thread(), 100);
    });

    ImageProcessorHandler.image_processor.on('message', (message: ImageResponse) => {
        if (message.type == 'log') {
            image_processor_logger.log(message.level, message.message);

            return;
        } else if (message.type == 'error') {
            ImageProcessorHandler.pending_requests.shift()?.reject(message.message);
        }

        if (!ImageProcessorHandler.pending_requests.length) return;

        ImageProcessorHandler.pending_requests.shift().resolve(message);

        if (ImageProcessorHandler.pending_requests.length) ImageProcessorHandler.image_processor.send(ImageProcessorHandler.pending_requests[0].options);
    });

    logger.info(`image processing thread started with PID ${ImageProcessorHandler.image_processor.pid}`);
};

setup_thread();