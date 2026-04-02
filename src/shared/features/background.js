export function applyBackground(host, { color, image }) {
    host.stage.style.backgroundColor = color;
    host.stage.style.backgroundImage = image ? `url("${image}")` : '';
}
