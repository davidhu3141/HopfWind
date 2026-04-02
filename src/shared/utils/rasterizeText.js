/**
 * Rasterize text to a transposed 2D grayscale matrix (columns x rows).
 */
export function rasterizeTextToTransposedMatrix(text, opts = {}) {
    const targetHeight = 90;
    const {
        fontFamily = 'sans-serif',
        padding = 2,
        sampleScale = 1,
    } = opts;

    if (typeof text !== 'string' || text.length === 0) {
        return [Array(targetHeight).fill(0)];
    }

    const clippedText = text.slice(0, 80);

    const makeCanvas = (width, height) => {
        if (typeof OffscreenCanvas !== 'undefined') {
            const canvas = new OffscreenCanvas(width, height);
            return { canvas, ctx: canvas.getContext('2d') };
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return { canvas, ctx: canvas.getContext('2d') };
    };

    let fontSize = targetHeight;
    const { ctx: measureContext } = makeCanvas(1, 1);
    let ascent = targetHeight;
    let descent = Math.round(targetHeight * 0.25);
    let left = 0;
    let right = targetHeight;

    for (let attempt = 0; attempt < 10; attempt += 1) {
        measureContext.font = `${fontSize}px ${fontFamily}`;
        const metrics = measureContext.measureText(`${clippedText}|`);

        ascent = metrics.actualBoundingBoxAscent || fontSize;
        descent = metrics.actualBoundingBoxDescent || Math.round(fontSize * 0.25);
        left = metrics.actualBoundingBoxLeft || 0;
        right = metrics.actualBoundingBoxRight || metrics.width;

        const totalHeight = ascent + descent;
        if (Math.abs(totalHeight - targetHeight) <= 0.5) {
            break;
        }

        fontSize *= targetHeight / totalHeight;
    }

    const width = Math.ceil(right - left + padding * 2);
    const height = Math.ceil(targetHeight + padding * 2);
    const scaledWidth = width * sampleScale;
    const scaledHeight = height * sampleScale;

    const { ctx } = makeCanvas(scaledWidth, scaledHeight);
    ctx.setTransform(sampleScale, 0, 0, sampleScale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(clippedText, padding - left, padding + ascent);

    const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight).data;
    const rows = Array.from({ length: height }, () => Array(width).fill(0));

    if (sampleScale === 1) {
        for (let y = 0; y < height; y += 1) {
            const rowOffset = y * scaledWidth * 4;
            for (let x = 0; x < width; x += 1) {
                const pixelOffset = rowOffset + x * 4;
                const r = imageData[pixelOffset];
                const g = imageData[pixelOffset + 1];
                const b = imageData[pixelOffset + 2];
                rows[y][x] = (r + g + b) / 765;
            }
        }
    } else {
        const area = sampleScale * sampleScale;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const x0 = x * sampleScale;
                const y0 = y * sampleScale;
                let sum = 0;
                for (let yy = 0; yy < sampleScale; yy += 1) {
                    let index = ((y0 + yy) * scaledWidth + x0) * 4;
                    for (let xx = 0; xx < sampleScale; xx += 1) {
                        sum += imageData[index] + imageData[index + 1] + imageData[index + 2];
                        index += 4;
                    }
                }
                rows[y][x] = sum / (765 * area);
            }
        }
    }

    ctx.canvas.width = 0;
    ctx.canvas.height = 0;

    return Array.from({ length: width }, (_, x) => Array.from({ length: height }, (_, y) => rows[y][x]));
}
