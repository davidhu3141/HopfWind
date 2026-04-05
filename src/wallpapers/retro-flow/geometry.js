import * as THREE from 'three';
import {
    CIRCLE_SLAB_TYPE,
    CIRCLE_TYPE,
    DOUBLE_CIRCLE_SLAB_TYPE,
    DOUBLE_CIRCLE_TYPE,
    JUST_BARS_TYPE,
    SAMPLE_SIZE_HALF,
    SLAB_TYPE,
} from './constants.js';

export function createBarEntry() {
    const createBarMesh = () => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
        geometry.setIndex([0, 1, 2, 0, 2, 3]);
        const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        return mesh;
    };

    const primary = createBarMesh();
    const secondary = createBarMesh();
    secondary.visible = false;
    return { primary, secondary };
}

export function getMirroredIndex(index) {
    return index >= SAMPLE_SIZE_HALF
        ? SAMPLE_SIZE_HALF * 3 - index - 1
        : index;
}

function getGeometryRotation(currentValues, frame) {
    const direction = currentValues.geometryreverse ? -1 : 1;
    return direction * frame * ((2 * Math.PI * currentValues.geometryrotationhz) / 60);
}

function getJustBarsWidthRatio(currentValues) {
    return currentValues.justbarswidth / 100;
}

function getCircleWidthRatio(currentValues) {
    return currentValues.circlebarwidth / 100;
}

function getDoubleCircleWidthRatio(currentValues) {
    return currentValues.doublecirclebarwidth / 100;
}

function getSlabWidthRatio(currentValues) {
    return currentValues.slabwidth / 100;
}

function getCircleSlabWidthRatio(currentValues) {
    return currentValues.circleslabbarwidth / 100;
}

function getDoubleCircleSlabWidthRatio(currentValues) {
    return currentValues.doublecircleslabbarwidth / 100;
}

function setQuadPositions(positionAttribute, points) {
    for (let index = 0; index < points.length; index += 1) {
        positionAttribute.setXYZ(index, points[index].x, points[index].y, 0);
    }
    positionAttribute.needsUpdate = true;
}

export function setBarGeometry(bar, primaryPoints, secondaryPoints = null) {
    setQuadPositions(bar.primary.geometry.attributes.position, primaryPoints);
    bar.primary.visible = true;

    if (secondaryPoints) {
        setQuadPositions(bar.secondary.geometry.attributes.position, secondaryPoints);
        bar.secondary.visible = true;
    } else {
        bar.secondary.visible = false;
    }
}

function buildJustBarsPoints(currentValues, index, sample, rotationAngle) {
    const height = currentValues.justbarslengthinitial / 30 + currentValues.justbarslengthchangebysound * sample;
    const widthRatio = getJustBarsWidthRatio(currentValues);
    const centerX = (index - 63.5) * currentValues.justbarsdistance;
    const halfWidth = (widthRatio * currentValues.justbarsdistance) / 2;

    let p = -height;
    let q = height;
    const shape = currentValues.justbarsshape;
    const isUp = shape === 'shapeC' || (shape === 'shapeA' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeB' && index >= SAMPLE_SIZE_HALF);
    const isDown = shape === 'shapeD' || (shape === 'shapeB' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeA' && index >= SAMPLE_SIZE_HALF);

    if (shape !== 'shapeE') {
        p = isUp ? 0 : -height;
        q = isDown ? 0 : height;
    }

    const localPoints = [
        new THREE.Vector2(centerX - halfWidth, p),
        new THREE.Vector2(centerX + halfWidth, p),
        new THREE.Vector2(centerX + halfWidth, q),
        new THREE.Vector2(centerX - halfWidth, q),
    ];

    if (rotationAngle === 0) {
        return localPoints;
    }

    return localPoints.map((point) => point.clone().rotateAround(new THREE.Vector2(0, 0), rotationAngle));
}

function buildCirclePoints(currentValues, sampleSize, index, sample, rotationAngle) {
    const height = currentValues.circlelengthinitial / 30 + currentValues.circlelengthchangebysound * sample;
    const radius = currentValues.circleradius;
    const thetaShift = THREE.MathUtils.degToRad(currentValues.circlethetashift);
    const thetaStep = (2 * Math.PI) / sampleSize;
    const thetaCenter = Math.PI / 2 + thetaShift + rotationAngle + thetaStep * (index + 0.5);
    const thetaHalfWidth = (thetaStep * getCircleWidthRatio(currentValues)) / 2;
    const theta0 = thetaCenter - thetaHalfWidth;
    const theta1 = thetaCenter + thetaHalfWidth;
    const innerRadius = currentValues.circleshape === 'two-sided'
        ? Math.max(0, radius - height)
        : radius;
    const outerRadius = radius + height;

    return [
        new THREE.Vector2(Math.cos(theta0) * innerRadius, Math.sin(theta0) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * innerRadius, Math.sin(theta1) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * outerRadius, Math.sin(theta1) * outerRadius),
        new THREE.Vector2(Math.cos(theta0) * outerRadius, Math.sin(theta0) * outerRadius),
    ];
}

function buildDoubleCirclePoints(currentValues, index, sample, rotationAngle) {
    const localIndex = index % SAMPLE_SIZE_HALF;
    const channelDirection = index < SAMPLE_SIZE_HALF ? -1 : 1;
    const height = currentValues.doublecirclelengthinitial / 30 + currentValues.doublecirclelengthchangebysound * sample;
    const radius = currentValues.doublecircleradius;
    const thetaShift = THREE.MathUtils.degToRad(currentValues.doublecirclethetashift);
    const thetaStep = (2 * Math.PI) / SAMPLE_SIZE_HALF;
    const thetaCenter = Math.PI / 2 + thetaShift + rotationAngle + thetaStep * (localIndex + 0.5);
    const thetaHalfWidth = (thetaStep * getDoubleCircleWidthRatio(currentValues)) / 2;
    const theta0 = thetaCenter - thetaHalfWidth;
    const theta1 = thetaCenter + thetaHalfWidth;
    const innerRadius = currentValues.doublecircleshape === 'two-sided'
        ? Math.max(0, radius - height)
        : radius;
    const outerRadius = radius + height;
    const centerOffsetX = channelDirection * radius * 1.1;

    return [
        new THREE.Vector2(Math.cos(theta0) * innerRadius + centerOffsetX, Math.sin(theta0) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * innerRadius + centerOffsetX, Math.sin(theta1) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * outerRadius + centerOffsetX, Math.sin(theta1) * outerRadius),
        new THREE.Vector2(Math.cos(theta0) * outerRadius + centerOffsetX, Math.sin(theta0) * outerRadius),
    ];
}

function buildSlabQuad(currentValues, index, shape, height, thickness, rotationAngle) {
    const widthRatio = getSlabWidthRatio(currentValues);
    const centerX = (index - 63.5) * currentValues.slabdistance;
    const halfWidth = (widthRatio * currentValues.slabdistance) / 2;
    const minY = shape === 'up' ? height : -height - thickness;
    const maxY = shape === 'up' ? height + thickness : -height;
    const localPoints = [
        new THREE.Vector2(centerX - halfWidth, minY),
        new THREE.Vector2(centerX + halfWidth, minY),
        new THREE.Vector2(centerX + halfWidth, maxY),
        new THREE.Vector2(centerX - halfWidth, maxY),
    ];

    if (rotationAngle === 0) {
        return localPoints;
    }

    return localPoints.map((point) => point.clone().rotateAround(new THREE.Vector2(0, 0), rotationAngle));
}

function buildSlabGeometry(currentValues, index, sample, rotationAngle) {
    const height = currentValues.slabheightinitial / 30 + currentValues.slabheightchangebysound * sample;
    const thickness = Math.max(0, currentValues.slabthickness);
    const shape = currentValues.slabshape;
    const isUp = shape === 'shapeC' || (shape === 'shapeA' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeB' && index >= SAMPLE_SIZE_HALF);
    const isDown = shape === 'shapeD' || (shape === 'shapeB' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeA' && index >= SAMPLE_SIZE_HALF);

    if (shape === 'shapeE') {
        return {
            primary: buildSlabQuad(currentValues, index, 'up', height, thickness, rotationAngle),
            secondary: buildSlabQuad(currentValues, index, 'down', height, thickness, rotationAngle),
        };
    }

    return {
        primary: buildSlabQuad(currentValues, index, isUp ? 'up' : 'down', height, thickness, rotationAngle),
    };
}

function buildCircleSlabSegment(theta0, theta1, innerRadius, thickness) {
    const outerRadius = innerRadius + thickness;
    return [
        new THREE.Vector2(Math.cos(theta0) * innerRadius, Math.sin(theta0) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * innerRadius, Math.sin(theta1) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * outerRadius, Math.sin(theta1) * outerRadius),
        new THREE.Vector2(Math.cos(theta0) * outerRadius, Math.sin(theta0) * outerRadius),
    ];
}

function buildCircleSlabGeometry(currentValues, sampleSize, index, sample, rotationAngle) {
    const height = currentValues.circleslabheightchangebysound * sample;
    const radius = currentValues.circleslabradius;
    const thickness = Math.max(0, currentValues.circleslabthickness);
    const thetaShift = THREE.MathUtils.degToRad(currentValues.circleslabthetashift);
    const thetaStep = (2 * Math.PI) / sampleSize;
    const thetaCenter = Math.PI / 2 + thetaShift + rotationAngle + thetaStep * (index + 0.5);
    const thetaHalfWidth = (thetaStep * getCircleSlabWidthRatio(currentValues)) / 2;
    const theta0 = thetaCenter - thetaHalfWidth;
    const theta1 = thetaCenter + thetaHalfWidth;

    const outwardInner = Math.max(0, radius + height);
    if (currentValues.circleslabshape === 'single-sided') {
        return {
            primary: buildCircleSlabSegment(theta0, theta1, outwardInner, thickness),
        };
    }

    const inwardInner = Math.max(0, radius - height - thickness);
    return {
        primary: buildCircleSlabSegment(theta0, theta1, outwardInner, thickness),
        secondary: buildCircleSlabSegment(theta0, theta1, inwardInner, thickness),
    };
}

function buildDoubleCircleSlabSegment(theta0, theta1, innerRadius, thickness, centerOffsetX) {
    const outerRadius = innerRadius + thickness;
    return [
        new THREE.Vector2(Math.cos(theta0) * innerRadius + centerOffsetX, Math.sin(theta0) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * innerRadius + centerOffsetX, Math.sin(theta1) * innerRadius),
        new THREE.Vector2(Math.cos(theta1) * outerRadius + centerOffsetX, Math.sin(theta1) * outerRadius),
        new THREE.Vector2(Math.cos(theta0) * outerRadius + centerOffsetX, Math.sin(theta0) * outerRadius),
    ];
}

function buildDoubleCircleSlabGeometry(currentValues, index, sample, rotationAngle) {
    const localIndex = index % SAMPLE_SIZE_HALF;
    const channelDirection = index < SAMPLE_SIZE_HALF ? -1 : 1;
    const height = currentValues.doublecircleslabheightchangebysound * sample;
    const radius = currentValues.doublecircleslabradius;
    const thickness = Math.max(0, currentValues.doublecircleslabthickness);
    const thetaShift = THREE.MathUtils.degToRad(currentValues.doublecircleslabthetashift);
    const thetaStep = (2 * Math.PI) / SAMPLE_SIZE_HALF;
    const thetaCenter = Math.PI / 2 + thetaShift + rotationAngle + thetaStep * (localIndex + 0.5);
    const thetaHalfWidth = (thetaStep * getDoubleCircleSlabWidthRatio(currentValues)) / 2;
    const theta0 = thetaCenter - thetaHalfWidth;
    const theta1 = thetaCenter + thetaHalfWidth;
    const centerOffsetX = channelDirection * radius * 1.1;

    const outwardInner = Math.max(0, radius + height);
    if (currentValues.doublecircleslabshape === 'single-sided') {
        return {
            primary: buildDoubleCircleSlabSegment(theta0, theta1, outwardInner, thickness, centerOffsetX),
        };
    }

    const inwardInner = Math.max(0, radius - height - thickness);
    return {
        primary: buildDoubleCircleSlabSegment(theta0, theta1, outwardInner, thickness, centerOffsetX),
        secondary: buildDoubleCircleSlabSegment(theta0, theta1, inwardInner, thickness, centerOffsetX),
    };
}

export function buildGeometryPoints(currentValues, sampleSize, index, sample, frame, geometryType) {
    const rotationAngle = getGeometryRotation(currentValues, frame);
    if (geometryType === CIRCLE_TYPE) {
        return { primary: buildCirclePoints(currentValues, sampleSize, index, sample, rotationAngle) };
    }
    if (geometryType === DOUBLE_CIRCLE_TYPE) {
        return { primary: buildDoubleCirclePoints(currentValues, index, sample, rotationAngle) };
    }
    if (geometryType === SLAB_TYPE) {
        return buildSlabGeometry(currentValues, index, sample, rotationAngle);
    }
    if (geometryType === CIRCLE_SLAB_TYPE) {
        return buildCircleSlabGeometry(currentValues, sampleSize, index, sample, rotationAngle);
    }
    if (geometryType === DOUBLE_CIRCLE_SLAB_TYPE) {
        return buildDoubleCircleSlabGeometry(currentValues, index, sample, rotationAngle);
    }
    return { primary: buildJustBarsPoints(currentValues, index, sample, rotationAngle) };
}

function usesStereoPairLayout(geometryType) {
    return geometryType === DOUBLE_CIRCLE_TYPE || geometryType === DOUBLE_CIRCLE_SLAB_TYPE;
}

export function getSampleForGeometryType(audioSamples, index, geometryType) {
    const sampleIndex = usesStereoPairLayout(geometryType)
        ? index
        : getMirroredIndex(index);
    return audioSamples[sampleIndex] ?? 0;
}

export function getSampleForGeometryPhase(audioSamples, index, geometryPhase) {
    const fromSample = getSampleForGeometryType(audioSamples, index, geometryPhase.fromType);
    if (geometryPhase.mix <= 0) {
        return fromSample;
    }

    const toSample = getSampleForGeometryType(audioSamples, index, geometryPhase.toType);
    return THREE.MathUtils.lerp(fromSample, toSample, geometryPhase.mix);
}

function createCollapsedPoints(points) {
    const centroid = points.reduce(
        (sum, point) => sum.add(point),
        new THREE.Vector2(0, 0),
    ).multiplyScalar(1 / points.length);
    return Array.from({ length: 4 }, () => centroid.clone());
}

function mixPointSets(fromPoints, toPoints, mix) {
    return fromPoints.map((point, index) => point.clone().lerp(toPoints[index], mix));
}

export function mixGeometrySet(fromGeometry, toGeometry, mix) {
    const primary = mixPointSets(fromGeometry.primary, toGeometry.primary, mix);

    const hasSecondary = Boolean(fromGeometry.secondary || toGeometry.secondary);
    if (!hasSecondary) {
        return { primary };
    }

    const fromSecondary = fromGeometry.secondary ?? createCollapsedPoints(toGeometry.secondary ?? fromGeometry.primary);
    const toSecondary = toGeometry.secondary ?? createCollapsedPoints(fromGeometry.secondary ?? toGeometry.primary);
    return {
        primary,
        secondary: mixPointSets(fromSecondary, toSecondary, mix),
    };
}
