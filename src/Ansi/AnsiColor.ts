import * as codes  from './AnsiCodes';
import { inRange } from '../misc';
import { Serializable, SerializeStrategy, defaultSerializeStrategy } from '../AST/miscInterfaces';

export interface RGB {
    r: number;
    g: number;
    b: number;
}

export type AnsiColorMode_3Bit = '3-bit';
export const AnsiColorMode_3Bit: AnsiColorMode_3Bit = '3-bit';
export type AnsiColorMode_8Bit = '8-bit';
export const AnsiColorMode_8Bit: AnsiColorMode_8Bit = '8-bit';
export type AnsiColorMode_24Bit = '24-bit';
export const AnsiColorMode_24Bit: AnsiColorMode_24Bit = '24-bit';

export type AnsiColorMode = (
    | AnsiColorMode_3Bit
    | AnsiColorMode_8Bit
    | AnsiColorMode_24Bit
);

export type AnsiColor = (
    | AnsiColor_3Bit
    | AnsiColor_8Bit
    | AnsiColor_24Bit
);

export abstract class AnsiColorBase implements Serializable {
    public abstract mode: AnsiColorMode;
    public abstract value: RGB | number;
    public abstract clone(): AnsiColor;

    public equalTo(other: AnsiColor): boolean {
        if (this.mode === '24-bit' || other.mode === '24-bit') {
            if (this.mode === '24-bit' && other.mode === '24-bit') {
                return (
                    (this as AnsiColor_24Bit).value.r === (other as AnsiColor_24Bit).value.r
                    && (this as AnsiColor_24Bit).value.g === (other as AnsiColor_24Bit).value.g
                    && (this as AnsiColor_24Bit).value.b === (other as AnsiColor_24Bit).value.b
                );
            } else return false;
        } else {
            let aVal: number = this.value as number;
            let bVal: number = other.value as number;

            if (this.mode === '3-bit') aVal = this.convert3BitTo8Bit(this.value as number);
            if (other.mode === '3-bit') bVal = this.convert3BitTo8Bit(other.value as number);

            return (aVal === bVal);
        }
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy};
        const obj: any = {
            mode: this.mode,
            value: this.value
        };
        return obj;
    }

    public toString(): string {
        if (this.mode === '24-bit') {
            const v: RGB = this.value as RGB;
            return `rgb(${v.r}, ${v.g}, ${v.b})`;
        } else {
            const v: number = this.value as number;
            if (this.mode === '3-bit') {
                return nameIndex['3-bit'][v];
            } else {
                const name = nameIndex['8-bit'][v];
                return (typeof name === 'string') ? name : `rgb(${name.r}, ${name.g}, ${name.b})`;
            }
        }
    }

    /**
     * ANSI 3bit color codes are included in the 8bit range but need to be shifted around
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
     * @param value 3bit value to convert to an 8bit color value
     * @returns {number} the 8bit value
     */
    private convert3BitTo8Bit(value: number): number {
        if (inRange(codes.FG_START, value, (codes.FG_CUSTOM - 1))) return value - codes.FG_START;
        else if (inRange(codes.BG_START, value, (codes.BG_CUSTOM - 1))) return value - codes.BG_START;
        else if (inRange(codes.FG_BRIGHT_START, value, (codes.FG_BRIGHT_END - 1))) return value - (codes.FG_BRIGHT_START + 2);
        else if (inRange(codes.BG_BRIGHT_START, value, (codes.BG_BRIGHT_END - 1))) return value - (codes.BG_BRIGHT_START + 2);
        else return value;
    }
}

export class AnsiColor_3Bit extends AnsiColorBase {
    public mode: AnsiColorMode_3Bit = AnsiColorMode_3Bit;
    public value: number;

    public constructor(value: number) {
        super();
        this.value = value;
    }

    public clone(): AnsiColor_3Bit {
        return new AnsiColor_3Bit(this.value);
    }
}

export class AnsiColor_8Bit extends AnsiColorBase {
    public mode: AnsiColorMode_8Bit = AnsiColorMode_8Bit;
    public value: number;

    public constructor(value: number) {
        super();
        this.value = value;
    }

    public clone(): AnsiColor_8Bit {
        return new AnsiColor_8Bit(this.value);
    }
}

export class AnsiColor_24Bit extends AnsiColorBase {
    public mode: AnsiColorMode_24Bit = AnsiColorMode_24Bit;
    public value: RGB;

    public constructor(value: RGB) {
        super();
        this.value = value;
    }
    public clone(): AnsiColor_24Bit {
        return new AnsiColor_24Bit(this.value);
    }

}


/**
 * **[Warning]**: this function will mutate the parameter `params`
 *
 * @param param color code
 * @param params current stack escape params **[warning will be mutated]**
 * @param paramsSafe original stack of escape params
 */
export function parseColorCode(param: number, params: number[], paramsSafe: number[]): AnsiColor {
    if (param === codes.FG_CUSTOM || param === codes.BG_CUSTOM) { // (16bit OR 8bit)
        const codeType = params.pop();
        if (codeType === codes.COLOR_MODE_8BIT) { // 8bit
            if (params.length >= 1) {
                return new AnsiColor_8Bit(params.pop());
            } else {
                throw new Error('Malformed ANSI color'); //MalformedAnsiColorCodeError(paramsSafe);
            }
        } else if (codeType === codes.COLOR_MODE_24BIT) { // 24bit
            if (params.length >= 3) {
                let r = params.pop();
                let g = params.pop();
                let b = params.pop();
                return new AnsiColor_24Bit({ r, g, b });
            } else {
                throw new Error('Malformed ANSI color'); //MalformedAnsiColorCodeError(paramsSafe);
            }
        } else {
            throw new Error('Malformed ANSI color'); //MalformedAnsiColorCodeError(paramsSafe);
        }
    } else { // 3bit
        return new AnsiColor_3Bit(param);
    }
}

export interface AnsiColorPalette {
    BLACK: AnsiColor;
    RED: AnsiColor;
    GREEN: AnsiColor;
    YELLOW: AnsiColor;
    BLUE: AnsiColor;
    MAGENTA: AnsiColor;
    CYAN: AnsiColor;
    WHITE: AnsiColor;
}

const paletteFromOffset = (offset: number): AnsiColorPalette => ({
    BLACK: new AnsiColor_3Bit(0 + offset),
    RED: new AnsiColor_3Bit(1 + offset),
    GREEN: new AnsiColor_3Bit(2 + offset),
    YELLOW: new AnsiColor_3Bit(3 + offset),
    BLUE: new AnsiColor_3Bit(4 + offset),
    MAGENTA: new AnsiColor_3Bit(5 + offset),
    CYAN: new AnsiColor_3Bit(6 + offset),
    WHITE: new AnsiColor_3Bit(7 + offset)
});

const nameIndexBase = {
    0: 'black',
    1: 'red',
    2: 'green',
    3: 'yellow',
    4: 'blue',
    5: 'magenta',
    6: 'cyan',
    7: 'white',
};


export const Colors: {
    fg: (
        & AnsiColorPalette
        & {
            bright: AnsiColorPalette;
            DEFAULT: AnsiColor;
        }
    );
    bg: (
        & AnsiColorPalette
        & {
            bright: AnsiColorPalette;
            DEFAULT: AnsiColor;
        }
    )
} = {
    fg: {
        ...paletteFromOffset(codes.FG_START),
        bright: {
            ...paletteFromOffset(codes.FG_BRIGHT_START),
        },
        DEFAULT: new AnsiColor_3Bit(codes.FG_DEFAULT)
    },
    bg: {
        ...paletteFromOffset(codes.BG_START),
        bright: {
            ...paletteFromOffset(codes.BG_BRIGHT_START),
        },
        DEFAULT: new AnsiColor_3Bit(codes.BG_DEFAULT)
    }
};


/**
 * Dump 8-bit val --> hex values from.
 *
 * ```javascript
 * [
 *     ...document.querySelectorAll('#collapsibleTable0 > tbody > tr:nth-child(5) td')
 * ].reduce((reduction, el) => {
 *     const red = Number.parseInt(el.title.substr(1,3), 16);
 *     const green = Number.parseInt(el.title.substr(4,6), 16);
 *     const blue = Number.parseInt(el.title.substr(4,6), 16);
 *     return `${reduction}\n        ${el.innerText}: { r: ${red}, g: ${green}, b: ${blue} },`;
 * }, '');
 * ```
 */

const nameIndex: any = {
    '3-bit': {
        ...Object.entries(nameIndexBase).reduce<{}>((
            (reduction, [code, name]) => ({
                 ...reduction,
                  [code + codes.FG_START]: name,
                  [code + codes.BG_START]: name,
                  [code + codes.FG_BRIGHT_START]: `bright${name[0].toUpperCase()}${name.substr(1)}`,
                  [code + codes.BG_BRIGHT_START]: `bright${name[0].toUpperCase()}${name.substr(1)}`
            })
        ), {
            [codes.FG_DEFAULT]: 'normal',
            [codes.BG_DEFAULT]: 'normal'
        })
    },
    '8-bit': {
        16: { r: 0, g: 0, b: 0 },
        17: { r: 0, g: 0, b: 95 },
        18: { r: 0, g: 0, b: 135 },
        19: { r: 0, g: 0, b: 175 },
        20: { r: 0, g: 0, b: 215 },
        21: { r: 0, g: 0, b: 255 },
        22: { r: 0, g: 95, b: 0 },
        23: { r: 0, g: 95, b: 95 },
        24: { r: 0, g: 95, b: 135 },
        25: { r: 0, g: 95, b: 175 },
        26: { r: 0, g: 95, b: 215 },
        27: { r: 0, g: 95, b: 255 },
        28: { r: 0, g: 135, b: 0 },
        29: { r: 0, g: 135, b: 95 },
        30: { r: 0, g: 135, b: 135 },
        31: { r: 0, g: 135, b: 175 },
        32: { r: 0, g: 135, b: 215 },
        33: { r: 0, g: 135, b: 255 },
        34: { r: 0, g: 175, b: 0 },
        35: { r: 0, g: 175, b: 95 },
        36: { r: 0, g: 175, b: 135 },
        37: { r: 0, g: 175, b: 175 },
        38: { r: 0, g: 175, b: 215 },
        39: { r: 0, g: 175, b: 255 },
        40: { r: 0, g: 215, b: 0 },
        41: { r: 0, g: 215, b: 95 },
        42: { r: 0, g: 215, b: 135 },
        43: { r: 0, g: 215, b: 175 },
        44: { r: 0, g: 215, b: 215 },
        45: { r: 0, g: 215, b: 255 },
        46: { r: 0, g: 255, b: 0 },
        47: { r: 0, g: 255, b: 95 },
        48: { r: 0, g: 255, b: 135 },
        49: { r: 0, g: 255, b: 175 },
        50: { r: 0, g: 255, b: 215 },
        51: { r: 0, g: 255, b: 255 },
        52: { r: 95, g: 0, b: 0 },
        53: { r: 95, g: 0, b: 95 },
        54: { r: 95, g: 0, b: 135 },
        55: { r: 95, g: 0, b: 175 },
        56: { r: 95, g: 0, b: 215 },
        57: { r: 95, g: 0, b: 255 },
        58: { r: 95, g: 95, b: 0 },
        59: { r: 95, g: 95, b: 95 },
        60: { r: 95, g: 95, b: 135 },
        61: { r: 95, g: 95, b: 175 },
        62: { r: 95, g: 95, b: 215 },
        63: { r: 95, g: 95, b: 255 },
        64: { r: 95, g: 135, b: 0 },
        65: { r: 95, g: 135, b: 95 },
        66: { r: 95, g: 135, b: 135 },
        67: { r: 95, g: 135, b: 175 },
        68: { r: 95, g: 135, b: 215 },
        69: { r: 95, g: 135, b: 255 },
        70: { r: 95, g: 175, b: 0 },
        71: { r: 95, g: 175, b: 95 },
        72: { r: 95, g: 175, b: 135 },
        73: { r: 95, g: 175, b: 175 },
        74: { r: 95, g: 175, b: 215 },
        75: { r: 95, g: 175, b: 255 },
        76: { r: 95, g: 215, b: 0 },
        77: { r: 95, g: 215, b: 95 },
        78: { r: 95, g: 215, b: 135 },
        79: { r: 95, g: 215, b: 175 },
        80: { r: 95, g: 215, b: 215 },
        81: { r: 95, g: 215, b: 255 },
        82: { r: 95, g: 255, b: 0 },
        83: { r: 95, g: 255, b: 95 },
        84: { r: 95, g: 255, b: 135 },
        85: { r: 95, g: 255, b: 175 },
        86: { r: 95, g: 255, b: 215 },
        87: { r: 95, g: 255, b: 255 },
        88: { r: 135, g: 0, b: 0 },
        89: { r: 135, g: 0, b: 95 },
        90: { r: 135, g: 0, b: 135 },
        91: { r: 135, g: 0, b: 175 },
        92: { r: 135, g: 0, b: 215 },
        93: { r: 135, g: 0, b: 255 },
        94: { r: 135, g: 95, b: 0 },
        95: { r: 135, g: 95, b: 95 },
        96: { r: 135, g: 95, b: 135 },
        97: { r: 135, g: 95, b: 175 },
        98: { r: 135, g: 95, b: 215 },
        99: { r: 135, g: 95, b: 255 },
        100: { r: 135, g: 135, b: 0 },
        101: { r: 135, g: 135, b: 95 },
        102: { r: 135, g: 135, b: 135 },
        103: { r: 135, g: 135, b: 175 },
        104: { r: 135, g: 135, b: 215 },
        105: { r: 135, g: 135, b: 255 },
        106: { r: 135, g: 175, b: 0 },
        107: { r: 135, g: 175, b: 95 },
        108: { r: 135, g: 175, b: 135 },
        109: { r: 135, g: 175, b: 175 },
        110: { r: 135, g: 175, b: 215 },
        111: { r: 135, g: 175, b: 255 },
        112: { r: 135, g: 215, b: 0 },
        113: { r: 135, g: 215, b: 95 },
        114: { r: 135, g: 215, b: 135 },
        115: { r: 135, g: 215, b: 175 },
        116: { r: 135, g: 215, b: 215 },
        117: { r: 135, g: 215, b: 255 },
        118: { r: 135, g: 255, b: 0 },
        119: { r: 135, g: 255, b: 95 },
        120: { r: 135, g: 255, b: 135 },
        121: { r: 135, g: 255, b: 175 },
        122: { r: 135, g: 255, b: 215 },
        123: { r: 135, g: 255, b: 255 },
        124: { r: 175, g: 0, b: 0 },
        125: { r: 175, g: 0, b: 95 },
        126: { r: 175, g: 0, b: 135 },
        127: { r: 175, g: 0, b: 175 },
        128: { r: 175, g: 0, b: 215 },
        129: { r: 175, g: 0, b: 255 },
        130: { r: 175, g: 95, b: 0 },
        131: { r: 175, g: 95, b: 95 },
        132: { r: 175, g: 95, b: 135 },
        133: { r: 175, g: 95, b: 175 },
        134: { r: 175, g: 95, b: 215 },
        135: { r: 175, g: 95, b: 255 },
        136: { r: 175, g: 135, b: 0 },
        137: { r: 175, g: 135, b: 95 },
        138: { r: 175, g: 135, b: 135 },
        139: { r: 175, g: 135, b: 175 },
        140: { r: 175, g: 135, b: 215 },
        141: { r: 175, g: 135, b: 255 },
        142: { r: 175, g: 175, b: 0 },
        143: { r: 175, g: 175, b: 95 },
        144: { r: 175, g: 175, b: 135 },
        145: { r: 175, g: 175, b: 175 },
        146: { r: 175, g: 175, b: 215 },
        147: { r: 175, g: 175, b: 255 },
        148: { r: 175, g: 215, b: 0 },
        149: { r: 175, g: 215, b: 95 },
        150: { r: 175, g: 215, b: 135 },
        151: { r: 175, g: 215, b: 175 },
        152: { r: 175, g: 215, b: 215 },
        153: { r: 175, g: 215, b: 255 },
        154: { r: 175, g: 255, b: 0 },
        155: { r: 175, g: 255, b: 95 },
        156: { r: 175, g: 255, b: 135 },
        157: { r: 175, g: 255, b: 175 },
        158: { r: 175, g: 255, b: 215 },
        159: { r: 175, g: 255, b: 255 },
        160: { r: 215, g: 0, b: 0 },
        161: { r: 215, g: 0, b: 95 },
        162: { r: 215, g: 0, b: 135 },
        163: { r: 215, g: 0, b: 175 },
        164: { r: 215, g: 0, b: 215 },
        165: { r: 215, g: 0, b: 255 },
        166: { r: 215, g: 95, b: 0 },
        167: { r: 215, g: 95, b: 95 },
        168: { r: 215, g: 95, b: 135 },
        169: { r: 215, g: 95, b: 175 },
        170: { r: 215, g: 95, b: 215 },
        171: { r: 215, g: 95, b: 255 },
        172: { r: 215, g: 135, b: 0 },
        173: { r: 215, g: 135, b: 95 },
        174: { r: 215, g: 135, b: 135 },
        175: { r: 215, g: 135, b: 175 },
        176: { r: 215, g: 135, b: 215 },
        177: { r: 215, g: 135, b: 255 },
        178: { r: 215, g: 175, b: 0 },
        179: { r: 215, g: 175, b: 95 },
        180: { r: 215, g: 175, b: 135 },
        181: { r: 215, g: 175, b: 175 },
        182: { r: 215, g: 175, b: 215 },
        183: { r: 215, g: 175, b: 255 },
        184: { r: 215, g: 215, b: 0 },
        185: { r: 215, g: 215, b: 95 },
        186: { r: 215, g: 215, b: 135 },
        187: { r: 215, g: 215, b: 175 },
        188: { r: 215, g: 215, b: 215 },
        189: { r: 215, g: 215, b: 255 },
        190: { r: 215, g: 255, b: 0 },
        191: { r: 215, g: 255, b: 95 },
        192: { r: 215, g: 255, b: 135 },
        193: { r: 215, g: 255, b: 175 },
        194: { r: 215, g: 255, b: 215 },
        195: { r: 215, g: 255, b: 255 },
        196: { r: 255, g: 0, b: 0 },
        197: { r: 255, g: 0, b: 95 },
        198: { r: 255, g: 0, b: 135 },
        199: { r: 255, g: 0, b: 175 },
        200: { r: 255, g: 0, b: 215 },
        201: { r: 255, g: 0, b: 255 },
        202: { r: 255, g: 95, b: 0 },
        203: { r: 255, g: 95, b: 95 },
        204: { r: 255, g: 95, b: 135 },
        205: { r: 255, g: 95, b: 175 },
        206: { r: 255, g: 95, b: 215 },
        207: { r: 255, g: 95, b: 255 },
        208: { r: 255, g: 135, b: 0 },
        209: { r: 255, g: 135, b: 95 },
        210: { r: 255, g: 135, b: 135 },
        211: { r: 255, g: 135, b: 175 },
        212: { r: 255, g: 135, b: 215 },
        213: { r: 255, g: 135, b: 255 },
        214: { r: 255, g: 175, b: 0 },
        215: { r: 255, g: 175, b: 95 },
        216: { r: 255, g: 175, b: 135 },
        217: { r: 255, g: 175, b: 175 },
        218: { r: 255, g: 175, b: 215 },
        219: { r: 255, g: 175, b: 255 },
        220: { r: 255, g: 215, b: 0 },
        221: { r: 255, g: 215, b: 95 },
        222: { r: 255, g: 215, b: 135 },
        223: { r: 255, g: 215, b: 175 },
        224: { r: 255, g: 215, b: 215 },
        225: { r: 255, g: 215, b: 255 },
        226: { r: 255, g: 255, b: 0 },
        227: { r: 255, g: 255, b: 95 },
        228: { r: 255, g: 255, b: 135 },
        229: { r: 255, g: 255, b: 175 },
        230: { r: 255, g: 255, b: 215 },
        231: { r: 255, g: 255, b: 255 },
        232: { r: 8, g: 8, b: 8 },
        233: { r: 18, g: 18, b: 18 },
        234: { r: 28, g: 28, b: 28 },
        235: { r: 38, g: 38, b: 38 },
        236: { r: 48, g: 48, b: 48 },
        237: { r: 58, g: 58, b: 58 },
        238: { r: 68, g: 68, b: 68 },
        239: { r: 78, g: 78, b: 78 },
        240: { r: 88, g: 88, b: 88 },
        241: { r: 98, g: 98, b: 98 },
        242: { r: 108, g: 108, b: 108 },
        243: { r: 118, g: 118, b: 118 },
        244: { r: 128, g: 128, b: 128 },
        245: { r: 138, g: 138, b: 138 },
        246: { r: 148, g: 148, b: 148 },
        247: { r: 158, g: 158, b: 158 },
        248: { r: 168, g: 168, b: 168 },
        249: { r: 178, g: 178, b: 178 },
        250: { r: 188, g: 188, b: 188 },
        251: { r: 198, g: 198, b: 198 },
        252: { r: 208, g: 208, b: 208 },
        253: { r: 218, g: 218, b: 218 },
        254: { r: 228, g: 228, b: 228 },
        255: { r: 238, g: 238, b: 238 },
        ...Object.entries(nameIndexBase).reduce<{}>((
            (reduction, [code, name]) => ({
                ...reduction,
                [code]: name,
                [code + 8]: `bright${name[0].toUpperCase()}${name.substr(1)}`
            })
        ), {})
    }
};
