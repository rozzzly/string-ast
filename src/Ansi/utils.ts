export const ansiStyleRegex: RegExp = /(\u001b\[(?:\d+;)*\d+m)/u;
export const ansiStyleParamsRegex: RegExp = /\u001b\[((?:\d+;)*\d+)m/u;

export const stripAnsiEscapes = (str: string): string => (
    str.split(ansiStyleRegex).reduce((reduction, part) => (
        ansiStyleRegex.test(part) ? reduction : reduction + part)
    ), ''
);


export function normalize(raw: string): string {
    return raw.normalize('NFC');
}

