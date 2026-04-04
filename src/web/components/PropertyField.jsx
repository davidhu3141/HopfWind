import { hexToRgbTriplet, rgbTripletToHex } from '../../shared/utils/color.js';

export function PropertyField({ descriptor, value, onChange }) {
    const id = `property-${descriptor.id}`;

    if (descriptor.type === 'bool') {
        return (
            <label className="field field-bool" htmlFor={id}>
                <span>{descriptor.label}</span>
                <input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
            </label>
        );
    }

    if (descriptor.type === 'slider') {
        return (
            <label className="field" htmlFor={id}>
                <span>{descriptor.label}</span>
                <div className="slider-row">
                    <input
                        id={id}
                        type="range"
                        min={descriptor.min}
                        max={descriptor.max}
                        step={descriptor.step ?? 1}
                        value={value}
                        onChange={(event) => onChange(Number(event.target.value))}
                    />
                    <output>{Number(value).toFixed(descriptor.precision ?? 0)}</output>
                </div>
            </label>
        );
    }

    if (descriptor.type === 'color') {
        return (
            <label className="field" htmlFor={id}>
                <span>{descriptor.label}</span>
                <div className="color-row">
                    <input
                        id={id}
                        type="color"
                        value={rgbTripletToHex(value)}
                        onChange={(event) => onChange(hexToRgbTriplet(event.target.value))}
                    />
                    <code>{value}</code>
                </div>
            </label>
        );
    }

    if (descriptor.type === 'file') {
        return (
            <label className="field" htmlFor={id}>
                <span>{descriptor.label}</span>
                <input
                    id={id}
                    type="file"
                    accept={descriptor.accept}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                            return;
                        }
                        onChange(URL.createObjectURL(file));
                    }}
                />
            </label>
        );
    }

    if (descriptor.type === 'combo') {
        return (
            <label className="field" htmlFor={id}>
                <span>{descriptor.label}</span>
                <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
                    {(descriptor.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>
        );
    }

    return (
        <label className="field" htmlFor={id}>
            <span>{descriptor.label}</span>
            <input id={id} type="text" value={value} onChange={(event) => onChange(event.target.value)} />
        </label>
    );
}
