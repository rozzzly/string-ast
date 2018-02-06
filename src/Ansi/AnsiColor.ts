import { inRange } from '../misc';
import { FG_CUSTOM, BG_CUSTOM, COLOR_MODE_8BIT, COLOR_MODE_24BIT } from './AnsiCodes';

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

export abstract class AnsiColorBase {
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

    /**
     * ANSI 3bit color codes are included in the 8bit range but need to be shifted around
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
     * @param value 3bit value to convert to an 8bit color value
     */
    private convert3BitTo8Bit(value: number): number {
        if (inRange(30, value, 37)) return value - 30;
        else if (inRange(40, value, 47)) return value - 40;
        else if (inRange(90, value, 97)) return value - 82;
        else if (inRange(100, value, 107)) return value - 92;
        else return value;
    }
}

export class AnsiColor_3Bit extends AnsiColorBase {
    public mode: AnsiColorMode_3Bit;
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
    public mode: AnsiColorMode_8Bit;
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
    public mode: AnsiColorMode_24Bit;
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
    if (param === FG_CUSTOM || param === BG_CUSTOM) { // (16bit OR 8bit)
        const codeType = params.pop();
        if (codeType === COLOR_MODE_8BIT) { // 8bit
            if (params.length >= 1) {
                return new AnsiColor_8Bit(params.pop());
            } else {
                throw new Error('Malformed ANSI color'); //MalformedAnsiColorCodeError(paramsSafe);
            }
        } else if (codeType === COLOR_MODE_24BIT) { // 24bit
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
    BLACK: new AnsiColor_3Bit(30 + offset),
    RED: new AnsiColor_3Bit(31 + offset),
    GREEN: new AnsiColor_3Bit(32 + offset),
    YELLOW: new AnsiColor_3Bit(33 + offset),
    BLUE: new AnsiColor_3Bit(34 + offset),
    MAGENTA: new AnsiColor_3Bit(35 + offset),
    CYAN: new AnsiColor_3Bit(36 + offset),
    WHITE: new AnsiColor_3Bit(37 + offset)
});

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
        ...paletteFromOffset(0),
        bright: {
            ...paletteFromOffset(60),
        },
        DEFAULT: new AnsiColor_3Bit(39)
    },
    bg: {
        ...paletteFromOffset(40),
        bright: {
            ...paletteFromOffset(70),
        },
        DEFAULT: new AnsiColor_3Bit(49),
    }
};
