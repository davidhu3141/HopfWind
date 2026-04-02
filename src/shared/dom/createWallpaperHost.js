export function createWallpaperHost(mountTarget) {
    const hostRoot = mountTarget ?? document.body;
    const stage = document.createElement('div');
    stage.className = 'wallpaper-stage';
    stage.style.position = 'relative';
    stage.style.width = '100%';
    stage.style.height = '100%';
    stage.style.overflow = 'hidden';
    stage.style.backgroundColor = '#000000';
    stage.style.backgroundSize = 'cover';
    stage.style.backgroundPosition = 'center';
    stage.style.backgroundRepeat = 'no-repeat';

    const canvasMount = document.createElement('div');
    canvasMount.style.position = 'absolute';
    canvasMount.style.inset = '0';

    const overlayMount = document.createElement('div');
    overlayMount.style.position = 'absolute';
    overlayMount.style.inset = '0';
    overlayMount.style.pointerEvents = 'none';

    const errorMount = document.createElement('div');
    errorMount.style.position = 'absolute';
    errorMount.style.right = '16px';
    errorMount.style.bottom = '16px';
    errorMount.style.maxWidth = 'min(420px, calc(100% - 32px))';
    errorMount.style.padding = '10px 12px';
    errorMount.style.borderRadius = '10px';
    errorMount.style.background = 'rgba(15, 15, 15, 0.82)';
    errorMount.style.color = '#f7f7f7';
    errorMount.style.fontFamily = 'monospace';
    errorMount.style.fontSize = '12px';
    errorMount.style.lineHeight = '1.5';
    errorMount.style.whiteSpace = 'pre-wrap';
    errorMount.style.display = 'none';
    errorMount.style.zIndex = '30';

    stage.append(canvasMount, overlayMount, errorMount);
    hostRoot.replaceChildren(stage);

    return {
        root: hostRoot,
        stage,
        canvasMount,
        overlayMount,
        showError(message) {
            errorMount.textContent = message;
            errorMount.style.display = 'block';
        },
        clearError() {
            errorMount.textContent = '';
            errorMount.style.display = 'none';
        },
        destroy() {
            stage.remove();
        },
    };
}
