export function computeSelectedEnergy(_currentValues, audioSamples) {
    let total = 0;
    for (let index = 0; index < audioSamples.length; index += 1) {
        total += audioSamples[index] ?? 0;
    }

    return audioSamples.length > 0 ? total / audioSamples.length : 0;
}

export function getGeometryScale(currentValues, selectedEnergy) {
    return Math.max(0.05, 1 + currentValues.geometrysizebyenergy * 0.015 * selectedEnergy);
}
