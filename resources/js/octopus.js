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
            console.error('Ink octopus worker error:', event.message, event.error);
        });
        worker.addEventListener('messageerror', (event) => {
            console.error('Ink octopus worker message error:', event.data);
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
            park(parked) {
                worker.postMessage({ type: 'park', parked });
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

    const { createInkOctopusRenderer } = await import('./octopus/renderer.js');
    const renderer = createInkOctopusRenderer(canvas, { frameRate: 60 });

    renderer.resize(viewport.width, viewport.height, viewport.density);
    renderer.start();

    return {
        pointer: (x, y) => renderer.setPointer(x, y),
        pointerLeave: () => renderer.clearPointer(),
        action: (intensity = 1) => renderer.trigger(intensity),
        park: (parked) => renderer.setParked(parked),
        resize() {
            const nextViewport = viewportState();
            renderer.resize(nextViewport.width, nextViewport.height, nextViewport.density);
        },
        pause: (paused) => renderer.setPaused(paused),
        destroy: () => renderer.stop(),
    };
}

export async function initInkOctopus() {
    const layer = document.querySelector('[data-ink-octopus]');

    if (!layer || layer.dataset.initialized === 'true') return;

    const canvas = layer.querySelector('[data-octopus-canvas]');
    const toggle = layer.querySelector('[data-octopus-toggle]');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!canvas || !toggle || motionPreference.matches) return;

    layer.dataset.initialized = 'true';
    layer.removeAttribute('hidden');

    const renderBridge = await createRenderBridge(canvas);
    let active = true;
    let parked = false;
    let resizeFrame = null;

    const handlePointerMove = (event) => {
        if (active && !toggle.contains(event.target)) {
            renderBridge.pointer(event.clientX, event.clientY);
        }
    };

    const handlePointerLeave = () => {
        renderBridge.pointerLeave();
    };

    const handlePointerDown = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (toggle.contains(event.target)) return;

        renderBridge.pointer(event.clientX, event.clientY);
        renderBridge.action(event.pointerType === 'touch' ? 1.25 : 1);
    };

    const handleToggle = () => {
        parked = !parked;
        renderBridge.park(parked);

        if (!parked) renderBridge.pointerLeave();

        layer.classList.toggle('is-parked', parked);
        toggle.setAttribute('aria-pressed', String(parked));
        toggle.setAttribute(
            'aria-label',
            parked ? 'Bring the octopus back' : 'Put the octopus away',
        );
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
        toggle.removeEventListener('click', handleToggle);
    };

    motionPreference.addEventListener('change', (event) => {
        if (event.matches) destroy();
    }, { once: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('blur', handlePointerLeave);
    window.addEventListener('resize', handleResize, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave);
    toggle.addEventListener('click', handleToggle);
}
