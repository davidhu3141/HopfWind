export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function getDefaultPropertyValues(schema) {
    return Object.fromEntries(schema.map((descriptor) => [descriptor.id, descriptor.default]));
}

export function mergePropertyValues(schema, baseValues, patchValues) {
    const merged = { ...baseValues };
    const knownIds = new Set(schema.map((descriptor) => descriptor.id));

    for (const [key, value] of Object.entries(patchValues ?? {})) {
        if (knownIds.has(key)) {
            merged[key] = value;
        }
    }

    return merged;
}

export function extractWpePropertyValues(payload) {
    if (!payload) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(payload)
            .filter(([, descriptor]) => descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
            .map(([key, descriptor]) => [key, descriptor.value]),
    );
}

export function buildWpeProjectProperties(schema) {
    return Object.fromEntries(
        schema.map((descriptor, index) => {
            const base = {
                order: 100 + index,
                index,
                text: descriptor.label,
                type: descriptor.type,
                value: descriptor.default,
            };

            if (descriptor.type === 'slider') {
                base.min = descriptor.min;
                base.max = descriptor.max;
                base.step = descriptor.step ?? (descriptor.fraction ? 0.1 : 1);
                base.fraction = !!descriptor.fraction;
                if (descriptor.precision != null) {
                    base.precision = descriptor.precision;
                }
            }

            if (descriptor.condition) {
                base.condition = descriptor.condition;
            }

            return [descriptor.id, base];
        }),
    );
}
