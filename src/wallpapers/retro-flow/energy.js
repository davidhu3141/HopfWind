export function computeEnergyBands(audioSamples) {
    let total = 0;
    for (let index = 0; index < audioSamples.length; index += 1) {
        total += audioSamples[index] ?? 0;
    }

    const average = audioSamples.length > 0 ? total / audioSamples.length : 0;
    return {
        all: average,
    };
}

export function computeSelectedEnergy(_currentValues, energyBands) {
    return energyBands.all ?? 0;
}

export function getGeometryScale(currentValues, selectedEnergy) {
    return Math.max(0.05, 1 + currentValues.geometrysizebyenergy * 0.1 * selectedEnergy);
}
