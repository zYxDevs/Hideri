import { fork } from 'child_process';

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

export abstract class ImageProcessorHandler {
    public static pending_requests: [Function, ImageIPCOptions][] = [];
    public static image_processor = fork(`${__dirname}/image-processor.js`, [], {
        stdio:  [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    });
    
    public static process(options: ImageIPCOptions): Promise<{ data: number[] }> {
        let promise_resolve: Function;
        const promise = new Promise<{ data: number[] }>(resolve => promise_resolve = resolve);
        this.pending_requests.push([promise_resolve, options]);

        if (this.pending_requests.length == 1) {
            this.image_processor.send(JSON.stringify(options));
        }

        return promise;
    }
}

ImageProcessorHandler.image_processor.on('message', message => {
    if (!ImageProcessorHandler.pending_requests.length) return;

    ImageProcessorHandler.pending_requests.shift()[0](message);

    if (ImageProcessorHandler.pending_requests.length) ImageProcessorHandler.image_processor.send(JSON.stringify(ImageProcessorHandler.pending_requests[0][1]));
});