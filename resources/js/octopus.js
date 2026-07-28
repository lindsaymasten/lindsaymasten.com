const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function viewportState() {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        density: clamp(window.devicePixelRatio || 1, 1, 1.6),
    };
}

async function createRenderBridge(canvas) {
    const viewport = viewportState();

    if ('transferControlToOffscreen' in canvas && 'Worker' in window) {
        const offscreen = canvas.transferControlToOffscreen();
        const worker = new Worker(new URL('./octopus.worker.js', import.meta.url), {
            type: 'module',
        });

        worker.addEventListener('error', (event) => {
            console.error('Mosaic octopus worker error:', event.message, event.error);
        });
        worker.addEventListener('messageerror', (event) => {
            console.error('Mosaic octopus worker message error:', event.data);
        });

        worker.postMessage({
            type: 'init',
            canvas: offscreen,
            ...viewport,
        }, [offscreen]);

        return {
            pointer(x, y) {
                worker.postMessage({ type: 'pointer', x, y });
            },
            pointerLeave() {
                worker.postMessage({ type: 'pointer-leave' });
            },
            action(intensity = 1) {
                worker.postMessage({ type: 'action', intensity });
            },
            resize() {
                worker.postMessage({ type: 'resize', ...viewportState() });
            },
            pause(paused) {
                worker.postMessage({ type: 'pause', paused });
            },
            destroy() {
                worker.postMessage({ type: 'destroy' });
                worker.terminate();
            },
        };
    }

    const { createMosaicOctopusRenderer } = await import('./octopus/renderer.js');
    const renderer = createMosaicOctopusRenderer(canvas, { frameRate: 60 });

    renderer.resize(viewport.width, viewport.height, viewport.density);
    renderer.start();

    return {
        pointer: (x, y) => renderer.setPointer(x, y),
        pointerLeave: () => renderer.clearPointer(),
        action: (intensity = 1) => renderer.trigger(intensity),
        resize() {
            const nextViewport = viewportState();
            renderer.resize(nextViewport.width, nextViewport.height, nextViewport.density);
        },
        pause: (paused) => renderer.setPaused(paused),
        destroy: () => renderer.stop(),
    };
}

export async function initMosaicOctopus() {
    const layer = document.querySelector('[data-mosaic-octopus]');

    if (!layer || layer.dataset.initialized === 'true') return;

    const canvas = layer.querySelector('[data-octopus-canvas]');
    const trigger = layer.querySelector('[data-octopus-trigger]');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!canvas || !trigger || motionPreference.matches) return;

    layer.dataset.initialized = 'true';
    layer.removeAttribute('hidden');

    const renderBridge = await createRenderBridge(canvas);
    let active = true;
    let resizeFrame = null;

    const handlePointerMove = (event) => {
        if (active) renderBridge.pointer(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
        renderBridge.pointerLeave();
    };

    const handlePointerDown = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        renderBridge.pointer(event.clientX, event.clientY);
        renderBridge.action(event.pointerType === 'touch' ? 1.25 : 1);
    };

    const handleResize = () => {
        if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);

        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            renderBridge.resize();
        });
    };

    const handleVisibility = () => {
        renderBridge.pause(document.hidden);
    };

    const destroy = () => {
        if (!active) return;

        active = false;
        if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
        renderBridge.destroy();
        layer.setAttribute('hidden', '');
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('blur', handlePointerLeave);
        window.removeEventListener('resize', handleResize);
        document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
        trigger.removeEventListener('click', handleTrigger);
    };

    const handleTrigger = () => renderBridge.action(1);

    motionPreference.addEventListener('change', (event) => {
        if (event.matches) destroy();
    }, { once: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('blur', handlePointerLeave);
    window.addEventListener('resize', handleResize, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave);
    trigger.addEventListener('click', handleTrigger);
}
