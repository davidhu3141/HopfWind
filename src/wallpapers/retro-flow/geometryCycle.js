import * as THREE from 'three';
import {
    CIRCLE_SLAB_TYPE,
    CIRCLE_TYPE,
    JUST_BARS_TYPE,
    SLAB_TYPE,
} from './constants.js';

export function createGeometryCycleState(currentType = JUST_BARS_TYPE) {
    return {
        currentType,
        targetType: currentType,
        transitionFromType: currentType,
        transitionStartSeconds: 0,
        nextSwitchSeconds: Infinity,
        enabledSignature: '',
        selectedType: currentType,
    };
}

function resetGeometryCycleState(state, currentType, interval, nowSeconds = 0) {
    state.currentType = currentType;
    state.targetType = currentType;
    state.transitionFromType = currentType;
    state.transitionStartSeconds = nowSeconds;
    state.nextSwitchSeconds = nowSeconds + interval;
}

function getEnabledGeometryTypes(currentValues) {
    const enabled = [];
    if (currentValues.cyclejustbars) {
        enabled.push(JUST_BARS_TYPE);
    }
    if (currentValues.cyclecircle) {
        enabled.push(CIRCLE_TYPE);
    }
    if (currentValues.cycleslab) {
        enabled.push(SLAB_TYPE);
    }
    if (currentValues.cyclecircleslab) {
        enabled.push(CIRCLE_SLAB_TYPE);
    }
    return enabled.length > 0 ? enabled : [currentValues.barsgeometrytype];
}

function chooseNextGeometryType(enabledTypes, currentType) {
    const candidates = enabledTypes.filter((type) => type !== currentType);
    if (candidates.length === 0) {
        return currentType;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

export function updateGeometryCycleState(state, currentValues, frame) {
    const nowSeconds = frame / 60;
    const enabledTypes = getEnabledGeometryTypes(currentValues);
    const enabledSignature = enabledTypes.join('|');
    const selectedType = currentValues.barsgeometrytype;
    const cycleInterval = currentValues.geometrycycleinterval ?? 8;

    if (state.enabledSignature !== enabledSignature || state.selectedType !== selectedType) {
        const nextType = enabledTypes.includes(selectedType) ? selectedType : enabledTypes[0];
        state.enabledSignature = enabledSignature;
        state.selectedType = selectedType;
        resetGeometryCycleState(state, nextType, cycleInterval, nowSeconds);
    }

    if (!currentValues.enablegeometrycycle || enabledTypes.length < 2) {
        state.currentType = selectedType;
        state.targetType = selectedType;
        state.transitionFromType = selectedType;
        return {
            fromType: selectedType,
            toType: selectedType,
            mix: 0,
        };
    }

    const duration = Math.max(0, currentValues.geometryinterpolateduration);
    if (state.currentType !== state.targetType) {
        const progress = duration <= 0
            ? 1
            : (nowSeconds - state.transitionStartSeconds) / duration;
        const mix = THREE.MathUtils.clamp(progress, 0, 1);
        if (mix >= 1) {
            state.currentType = state.targetType;
            state.transitionFromType = state.targetType;
            state.transitionStartSeconds = nowSeconds;
            state.nextSwitchSeconds = nowSeconds + cycleInterval;
            return {
                fromType: state.currentType,
                toType: state.currentType,
                mix: 0,
            };
        }
        return {
            fromType: state.transitionFromType,
            toType: state.targetType,
            mix,
        };
    }

    if (nowSeconds >= state.nextSwitchSeconds) {
        const nextType = chooseNextGeometryType(enabledTypes, state.currentType);
        state.transitionFromType = state.currentType;
        state.targetType = nextType;
        state.transitionStartSeconds = nowSeconds;
        if (duration <= 0) {
            state.currentType = nextType;
            state.transitionFromType = nextType;
            state.nextSwitchSeconds = nowSeconds + cycleInterval;
            return {
                fromType: nextType,
                toType: nextType,
                mix: 0,
            };
        }
        return {
            fromType: state.transitionFromType,
            toType: nextType,
            mix: 0,
        };
    }

    return {
        fromType: state.currentType,
        toType: state.currentType,
        mix: 0,
    };
}
