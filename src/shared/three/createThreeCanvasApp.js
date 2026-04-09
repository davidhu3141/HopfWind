import { MathUtils, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

function applyCanvasStyle(canvas, metrics) {
    canvas.style.position = 'absolute';
    canvas.style.left = `${metrics.left}px`;
    canvas.style.top = `${metrics.top}px`;
    canvas.style.width = `${metrics.width}px`;
    canvas.style.height = `${metrics.height}px`;
    canvas.style.imageRendering = metrics.pixelated > 1 ? 'pixelated' : 'auto';
}

function computeRenderMetrics(host, pixelated, canvasScale, offsetX, offsetY) {
    const bounds = host.stage.getBoundingClientRect();
    const width = bounds.width || window.innerWidth;
    const height = bounds.height || window.innerHeight;
    const scaledWidth = width / canvasScale;
    const scaledHeight = height / canvasScale;

    return {
        width: scaledWidth,
        height: scaledHeight,
        renderWidth: Math.max(1, Math.round(scaledWidth / pixelated)),
        renderHeight: Math.max(1, Math.round(scaledHeight / pixelated)),
        left: (width * (1 - 1 / canvasScale + offsetX)) / 2,
        top: (height * (1 - 1 / canvasScale + offsetY)) / 2,
        pixelated,
    };
}

function updateOrthographicCamera(camera, viewZ, viewport, viewAngle, showHalf) {
    const aspect = viewport.width / viewport.height;
    const referenceFov = 30;
    const halfHeight = viewZ * Math.tan(MathUtils.degToRad(referenceFov / 2));
    const halfWidth = halfHeight * aspect;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.near = 1;
    camera.far = showHalf ? viewZ : viewZ * 2;
    camera.position.z = viewZ * Math.cos(viewAngle);
    camera.position.y = viewZ * Math.sin(viewAngle);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}

function updatePerspectiveCamera(camera, fov, viewZ, viewport, viewAngle, showHalf) {
    camera.aspect = viewport.width / viewport.height;
    camera.fov = fov;
    camera.near = 1;
    camera.far = showHalf ? viewZ : viewZ * 2;
    camera.position.z = viewZ * Math.cos(viewAngle);
    camera.position.y = viewZ * Math.sin(viewAngle);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}

export function createThreeCanvasApp(host, options = {}) {
    const {
        cameraType = 'orthographic',
        viewZ: initialViewZ = 60,
        showHalf: initialShowHalf = false,
        fov: initialFov = 30,
        alpha = true,
        antialias = true,
        sortObjects = false,
    } = options;

    const scene = new Scene();
    const camera = cameraType === 'orthographic'
        ? new OrthographicCamera(-1, 1, 1, -1, 1, initialViewZ * 2)
        : new PerspectiveCamera(initialFov, 1, 1, initialViewZ * 2);

    const renderer = new WebGLRenderer({
        alpha,
        antialias,
        sortObjects,
    });
    renderer.setClearColor(0x000000, 0);
    host.canvasMount.appendChild(renderer.domElement);

    let viewportState = {
        pixelated: 1,
        canvasScale: 1,
        offsetX: 0,
        offsetY: 0,
        viewAngle: 0,
        viewZ: initialViewZ,
        showHalf: initialShowHalf,
        fov: initialFov,
    };

    const resize = (nextViewportState = viewportState) => {
        viewportState = { ...viewportState, ...nextViewportState };
        const metrics = computeRenderMetrics(
            host,
            viewportState.pixelated,
            viewportState.canvasScale,
            viewportState.offsetX,
            viewportState.offsetY,
        );

        renderer.setSize(metrics.renderWidth, metrics.renderHeight, false);
        applyCanvasStyle(renderer.domElement, metrics);

        if (cameraType === 'orthographic') {
            updateOrthographicCamera(
                camera,
                viewportState.viewZ,
                metrics,
                viewportState.viewAngle,
                viewportState.showHalf,
            );
        } else {
            updatePerspectiveCamera(
                camera,
                viewportState.fov / viewportState.canvasScale,
                viewportState.viewZ,
                metrics,
                viewportState.viewAngle,
                viewportState.showHalf,
            );
        }

        return metrics;
    };

    return {
        scene,
        camera,
        renderer,
        resize,
        getViewportState() {
            return { ...viewportState };
        },
        dispose() {
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
}
