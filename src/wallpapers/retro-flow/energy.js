function getActiveEnergySampleCount(currentValues) {
    let count = 0;
    if (currentValues.useenergylow) {
        count += 8;
    }
    if (currentValues.useenergymid) {
        count += 84;
    }
    if (currentValues.useenergyhigh) {
        count += 36;
    }
    return count;
}

export function computeEnergyBands(audioSamples) {
    const sumStereoRange = (start, end) => {
        let total = 0;
        for (let index = start; index <= end; index += 1) {
            total += (audioSamples[index] ?? 0) + (audioSamples[index + 64] ?? 0);
        }
        return total;
    };

    return {
        low: sumStereoRange(0, 3),
        mid: sumStereoRange(4, 45),
        high: sumStereoRange(46, 63),
    };
}

export function computeSelectedEnergy(currentValues, energyBands) {
    let total = 0;
    if (currentValues.useenergylow) {
        total += energyBands.low;
    }
    if (currentValues.useenergymid) {
        total += energyBands.mid;
    }
    if (currentValues.useenergyhigh) {
        total += energyBands.high;
    }
    return total;
}

export function getGeometryScale(currentValues, selectedEnergy) {
    const activeSampleCount = getActiveEnergySampleCount(currentValues);
    const normalizedEnergy = activeSampleCount > 0 ? selectedEnergy / activeSampleCount : 0;
    return Math.max(0.05, 1 + currentValues.geometrysizebyenergy * 0.1 * normalizedEnergy);
}
