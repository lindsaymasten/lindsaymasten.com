import { createInkOctopusRenderer } from './octopus/renderer.js';

let renderer = null;

self.addEventListener('message', (event) => {
    const message = event.data;

    if (message.type === 'init') {
        renderer = createInkOctopusRenderer(message.canvas, { frameRate: 60 });
        renderer.resize(message.width, message.height, message.density);
        renderer.start();
        return;
    }

    if (!renderer) return;

    if (message.type === 'pointer') {
        renderer.setPointer(message.x, message.y);
    } else if (message.type === 'pointer-leave') {
        renderer.clearPointer();
    } else if (message.type === 'action') {
        renderer.trigger(message.intensity);
    } else if (message.type === 'park') {
        renderer.setParked(message.parked);
    } else if (message.type === 'resize') {
        renderer.resize(message.width, message.height, message.density);
    } else if (message.type === 'pause') {
        renderer.setPaused(message.paused);
    } else if (message.type === 'destroy') {
        renderer.stop();
        renderer = null;
        self.close();
    }
});
