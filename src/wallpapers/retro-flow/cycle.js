import * as THREE from 'three';
import {
    CIRCLE_SLAB_TYPE,
    CIRCLE_TYPE,
    DEFAULT_FLOW_TYPE,
    DEFAULT_GEOMETRY_TYPE,
    DEFAULT_WARP_TYPE,
    DOUBLE_CIRCLE_SLAB_TYPE,
    DOUBLE_CIRCLE_TYPE,
    FLOW_GRID_TYPE,
    FLOW_POLYGON_TYPE,
    FLOW_SADDLE_TYPE,
    FLOW_SWIRL_TYPE,
    JUST_BARS_TYPE,
    SLAB_TYPE,
    WARP_FLOWER_TYPE,
    WARP_GRID_TYPE,
    WARP_NONE_TYPE,
    WARP_RADIAL_TYPE,
    WARP_TRIANGULAR_TYPE,
    WARP_TWIST_TYPE,
    WARP_WAVE_TYPE,
} from './constants.js';

function createDomainState(defaultType) {
    return {
        currentType: defaultType,
        targetType: defaultType,
        transitionFromType: defaultType,
        fallbackUsed: false,
    };
}

function buildCycleStateSignature(resolved) {
    return [
        resolved.geometry.enabledTypes.join('|'),
        resolved.flow.enabledTypes.join('|'),
        resolved.warp.enabledTypes.join('|'),
        resolved.color.enabled ? 'color-on' : 'color-off',
    ].join('::');
}

function chooseNextType(enabledTypes, currentType) {
    const candidates = enabledTypes.filter((type) => type !== currentType);
    if (candidates.length === 0) {
        return currentType;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function createStaticPhase(state) {
    return {
        fromType: state.currentType,
        toType: state.currentType,
        mix: 0,
    };
}

function createColorPhase(state) {
    return {
        fromToken: state.currentToken,
        toToken: state.currentToken,
        mix: 0,
    };
}

function getEligibleDomains(resolved) {
    const domains = ['geometry', 'flow', 'warp'].filter((domain) => resolved[domain].enabledTypes.length > 1);
    if (resolved.color.enabled) {
        domains.push('color');
    }
    return domains;
}

export function resolveCycleTypes(currentValues) {
    const geometryEnabled = [];
    if (currentValues.cyclegeometryjustbars) {
        geometryEnabled.push(JUST_BARS_TYPE);
    }
    if (currentValues.cyclegeometrycircle) {
        geometryEnabled.push(CIRCLE_TYPE);
    }
    if (currentValues.cyclegeometrydoublecircle) {
        geometryEnabled.push(DOUBLE_CIRCLE_TYPE);
    }
    if (currentValues.cyclegeometryslab) {
        geometryEnabled.push(SLAB_TYPE);
    }
    if (currentValues.cyclegeometrycircleslab) {
        geometryEnabled.push(CIRCLE_SLAB_TYPE);
    }
    if (currentValues.cyclegeometrydoublecircleslab) {
        geometryEnabled.push(DOUBLE_CIRCLE_SLAB_TYPE);
    }

    const flowEnabled = [];
    if (currentValues.cycleflowswirl) {
        flowEnabled.push(FLOW_SWIRL_TYPE);
    }
    if (currentValues.cycleflowgrid) {
        flowEnabled.push(FLOW_GRID_TYPE);
    }
    if (currentValues.cycleflowsaddle) {
        flowEnabled.push(FLOW_SADDLE_TYPE);
    }
    if (currentValues.cycleflowpolygon) {
        flowEnabled.push(FLOW_POLYGON_TYPE);
    }

    const warpEnabled = [];
    if (currentValues.cyclewarpradial) {
        warpEnabled.push(WARP_RADIAL_TYPE);
    }
    if (currentValues.cyclewarpnone) {
        warpEnabled.push(WARP_NONE_TYPE);
    }
    if (currentValues.cyclewarptwist) {
        warpEnabled.push(WARP_TWIST_TYPE);
    }
    if (currentValues.cyclewarpgrid) {
        warpEnabled.push(WARP_GRID_TYPE);
    }
    if (currentValues.cyclewarpwave) {
        warpEnabled.push(WARP_WAVE_TYPE);
    }
    if (currentValues.cyclewarpflower) {
        warpEnabled.push(WARP_FLOWER_TYPE);
    }
    if (currentValues.cyclewarptriangular) {
        warpEnabled.push(WARP_TRIANGULAR_TYPE);
    }

    return {
        geometry: {
            enabledTypes: geometryEnabled.length > 0 ? geometryEnabled : [DEFAULT_GEOMETRY_TYPE],
            fallbackUsed: geometryEnabled.length === 0,
            defaultType: DEFAULT_GEOMETRY_TYPE,
        },
        flow: {
            enabledTypes: flowEnabled.length > 0 ? flowEnabled : [DEFAULT_FLOW_TYPE],
            fallbackUsed: flowEnabled.length === 0,
            defaultType: DEFAULT_FLOW_TYPE,
        },
        warp: {
            enabledTypes: warpEnabled.length > 0 ? warpEnabled : [DEFAULT_WARP_TYPE],
            fallbackUsed: warpEnabled.length === 0,
            defaultType: DEFAULT_WARP_TYPE,
        },
        color: {
            enabled: Boolean(currentValues.cyclerandomcolor),
        },
    };
}

export function createCycleState(resolved = null) {
    const state = {
        geometry: createDomainState(DEFAULT_GEOMETRY_TYPE),
        flow: createDomainState(DEFAULT_FLOW_TYPE),
        warp: createDomainState(DEFAULT_WARP_TYPE),
        color: {
            currentToken: 0,
            targetToken: 0,
            transitionFromToken: 0,
        },
        activeDomain: '',
        transitionStartSeconds: 0,
        nextSwitchSeconds: Infinity,
        signature: '',
    };

    if (resolved) {
        resetCycleState(state, resolved, 8, 0);
    }

    return state;
}

export function resetCycleState(state, resolved, intervalSeconds, nowSeconds) {
    state.signature = buildCycleStateSignature(resolved);
    state.activeDomain = '';
    state.transitionStartSeconds = nowSeconds;
    state.nextSwitchSeconds = nowSeconds + intervalSeconds;

    for (const domainName of ['geometry', 'flow', 'warp']) {
        const domain = state[domainName];
        const resolvedDomain = resolved[domainName];
        const nextType = resolvedDomain.enabledTypes.includes(domain.currentType)
            ? domain.currentType
            : resolvedDomain.enabledTypes[0];
        domain.currentType = nextType;
        domain.targetType = nextType;
        domain.transitionFromType = nextType;
        domain.fallbackUsed = resolvedDomain.fallbackUsed;
    }

    state.color.currentToken = 0;
    state.color.targetToken = 0;
    state.color.transitionFromToken = 0;
}

export function updateCycleState(state, resolved, currentValues, frame) {
    const nowSeconds = frame / 60;
    const intervalSeconds = currentValues.cycleinterval ?? 8;
    const durationSeconds = Math.max(0, currentValues.cycleinterpolateduration ?? 1);
    const signature = buildCycleStateSignature(resolved);

    if (state.signature !== signature) {
        resetCycleState(state, resolved, intervalSeconds, nowSeconds);
    }

    const phases = {
        geometry: createStaticPhase(state.geometry),
        flow: createStaticPhase(state.flow),
        warp: createStaticPhase(state.warp),
        color: createColorPhase(state.color),
    };

    if (state.activeDomain) {
        const domain = state[state.activeDomain];
        const mix = durationSeconds <= 0
            ? 1
            : THREE.MathUtils.clamp((nowSeconds - state.transitionStartSeconds) / durationSeconds, 0, 1);

        if (mix >= 1) {
            if (state.activeDomain === 'color') {
                phases.color = {
                    fromToken: domain.transitionFromToken,
                    toToken: domain.targetToken,
                    mix: 1,
                };
                domain.currentToken = domain.targetToken;
                domain.transitionFromToken = domain.targetToken;
                state.activeDomain = '';
                state.transitionStartSeconds = nowSeconds;
                state.nextSwitchSeconds = nowSeconds + intervalSeconds;
                return phases;
            } else {
                domain.currentType = domain.targetType;
                domain.transitionFromType = domain.targetType;
            }
            state.activeDomain = '';
            state.transitionStartSeconds = nowSeconds;
            state.nextSwitchSeconds = nowSeconds + intervalSeconds;
        } else {
            if (state.activeDomain === 'color') {
                phases.color = {
                    fromToken: domain.transitionFromToken,
                    toToken: domain.targetToken,
                    mix,
                };
            } else {
                phases[state.activeDomain] = {
                    fromType: domain.transitionFromType,
                    toType: domain.targetType,
                    mix,
                };
            }
            return phases;
        }
    }

    phases.geometry = createStaticPhase(state.geometry);
    phases.flow = createStaticPhase(state.flow);
    phases.warp = createStaticPhase(state.warp);
    phases.color = createColorPhase(state.color);

    const eligibleDomains = getEligibleDomains(resolved);
    if (eligibleDomains.length === 0 || nowSeconds < state.nextSwitchSeconds) {
        return phases;
    }

    const domainName = eligibleDomains[Math.floor(Math.random() * eligibleDomains.length)];
    const domain = state[domainName];

    if (domainName === 'color') {
        const nextToken = domain.currentToken + 1;
        domain.transitionFromToken = domain.currentToken;
        domain.targetToken = nextToken;
        state.activeDomain = domainName;
        state.transitionStartSeconds = nowSeconds;

        if (durationSeconds <= 0) {
            domain.currentToken = nextToken;
            domain.transitionFromToken = nextToken;
            state.activeDomain = '';
            state.nextSwitchSeconds = nowSeconds + intervalSeconds;
            phases.color = createColorPhase(domain);
            return phases;
        }

        phases.color = {
            fromToken: domain.transitionFromToken,
            toToken: nextToken,
            mix: 0,
        };
        return phases;
    }

    const enabledTypes = resolved[domainName].enabledTypes;
    const nextType = chooseNextType(enabledTypes, domain.currentType);

    if (nextType === domain.currentType) {
        state.nextSwitchSeconds = nowSeconds + intervalSeconds;
        return phases;
    }

    domain.transitionFromType = domain.currentType;
    domain.targetType = nextType;
    state.activeDomain = domainName;
    state.transitionStartSeconds = nowSeconds;

    if (durationSeconds <= 0) {
        domain.currentType = nextType;
        domain.transitionFromType = nextType;
        state.activeDomain = '';
        state.nextSwitchSeconds = nowSeconds + intervalSeconds;
        phases[domainName] = createStaticPhase(domain);
        return phases;
    }

    phases[domainName] = {
        fromType: domain.transitionFromType,
        toType: nextType,
        mix: 0,
    };
    return phases;
}
