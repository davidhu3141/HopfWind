/**
 * Rasterize text to a transposed 2D grayscale matrix (0..1)
 * with total text height fixed at 122px.
 *
 * @param {string} text
 * @param {Object} [opts]
 * @param {string} [opts.fontFamily='sans-serif'] - Font family.
 * @param {number} [opts.padding=2] - Padding around the text.
 * @param {number} [opts.sampleScale=1] - Supersample scale.
 * @returns {number[][]} Transposed grayscale matrix (columns x rows)
 */
export function rasterizeTextToTransposedMatrix(text, opts = {}) {

    // Desired pixel height for text (ascent + descent)
    const targetHeight = 90;

    const {
        fontFamily = 'sans-serif',
        padding = 2,
        sampleScale = 1
    } = opts;

    if (typeof text !== 'string' || !text.length) return [Array(targetHeight).fill(0)];
    text = text.substring(0, 80)

    // Temp canvas for measuring
    const makeCanvas = (w, h) => {
        if (typeof OffscreenCanvas !== 'undefined') {
            const c = new OffscreenCanvas(w, h);
            return { canvas: c, ctx: c.getContext('2d') };
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return { canvas: c, ctx: c.getContext('2d') };
    };

    // Start with guessed font size (adjust until we hit target height)
    let fontSize = targetHeight;
    const { ctx: measureCtx } = makeCanvas(1, 1);
    let ascent, descent, left, right;

    let loopcount = 0
    while (true) {
        if (loopcount++ > 10) break;
        measureCtx.font = `${fontSize}px ${fontFamily}`;
        const m = measureCtx.measureText(text + "|"); // make uniform height

        ascent = m.actualBoundingBoxAscent || fontSize;
        descent = m.actualBoundingBoxDescent || Math.round(fontSize * 0.25);
        left = m.actualBoundingBoxLeft || 0;
        right = m.actualBoundingBoxRight || m.width;

        const totalHeight = ascent + descent;
        if (Math.abs(totalHeight - targetHeight) <= 0.5) break;
        fontSize *= targetHeight / totalHeight;
    }

    const w = Math.ceil((right - left) + padding * 2);
    const h = Math.ceil(targetHeight + padding * 2);

    // Supersample dimensions
    const W = w * sampleScale;
    const H = h * sampleScale;

    // Draw the text
    const { ctx } = makeCanvas(W, H);
    ctx.setTransform(sampleScale, 0, 0, sampleScale, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000';
    const x = padding - left;
    const y = padding + ascent;
    ctx.fillText(text, x, y);

    // Read pixels
    const img = ctx.getImageData(0, 0, W, H).data;

    // Create grayscale float array
    const arr = Array.from({ length: h }, () => Array(w).fill(0));

    if (sampleScale === 1) {
        for (let ty = 0; ty < h; ty++) {
            let base = ty * W * 4;
            for (let tx = 0; tx < w; tx++) {
                const a = img[base + tx * 4 + 3]; // alpha
                arr[ty][tx] = a / 255; // normalize to 0..1
            }
        }
    } else {
        const area = sampleScale * sampleScale;
        for (let ty = 0; ty < h; ty++) {
            for (let tx = 0; tx < w; tx++) {
                const x0 = tx * sampleScale;
                const y0 = ty * sampleScale;
                let sum = 0;
                for (let yy = 0; yy < sampleScale; yy++) {
                    let idx = ((y0 + yy) * W + x0) * 4 + 3; // alpha
                    for (let xx = 0; xx < sampleScale; xx++) {
                        sum += img[idx];
                        idx += 4;
                    }
                }
                arr[ty][tx] = (sum / area) / 255;
            }
        }
    }

    // Transpose
    const transposed = Array.from({ length: w }, (_, i) =>
        Array.from({ length: h }, (_, j) => arr[j][i])
    );

    // Nudge GC by nulling large objects
    ctx.canvas.width = 0;
    ctx.canvas.height = 0;

    return transposed;
}

// Example:
// const mat = rasterizeTextToTransposedMatrix("Hello", { fontFamily: "monospace", sampleScale: 2 });
// console.log(mat); // -> grayscale 2D array, transposed
