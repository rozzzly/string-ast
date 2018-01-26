export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface AnsiColorPalette {
    BLACK: number,
    RED: number,
    GREEN: number,
    YELLOW: number;
    BLUE: number;
    MAGENTA: number;
    CYAN: number;
    WHITE: number;
}

const paletteFromOffset = (offset: number): AnsiColorPalette => ({
    BLACK: 30 + offset,
    RED: 31 + offset,
    GREEN: 32 + offset,
    YELLOW: 33 + offset,
    BLUE: 34 + offset,
    MAGENTA: 35 + offset,
    CYAN: 36 + offset,
    WHITE: 37 + offset,
});

export const Colors: {
    fg: (
        & AnsiColorPalette
        & {
            bright: AnsiColorPalette;
            DEFAULT: number;
            RESET: number;
        }
    );
    bg: (
        & AnsiColorPalette
        & {
            bright: AnsiColorPalette;
            DEFAULT: number;
            RESET: number;
        }
    )
} = {
    fg: {
        ...paletteFromOffset(0),
        bright: {
            ...paletteFromOffset(60),
        },
        RESET: 38,
        DEFAULT: 39,
    },
    bg: {
        ...paletteFromOffset(40),
        bright: {
            ...paletteFromOffset(70),
        },
        RESET: 48,
        DEFAULT: 49,
    }
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
)

export abstract class AnsiColorBase {
    public abstract mode: AnsiColorMode;
    public abstract value: RGB | number;

    public equalTo(other: AnsiColor): boolean {
        return false;
    }
}

export class AnsiColor_3Bit extends AnsiColorBase {
    public mode: AnsiColorMode_3Bit;
    public value: number;

    public constructor(value: number) {
        super();
        this.value = value;
    }
}

export class AnsiColor_8Bit extends AnsiColorBase {
    public mode: AnsiColorMode_8Bit;
    public value: number;

    public constructor(value: number) {
        super();
        this.value = value;
    }
}

export class AnsiColor_24Bit extends AnsiColorBase {
    public mode: AnsiColorMode_24Bit;
    public value: RGB;

    public constructor(value: RGB) {
        super();
        this.value = value;
    }
}

export type AnsiTextWeight = (
    | 'bold'
    | 'faint'
    | 'normal'
);

export interface AnsiStyleData {
    bgColor: AnsiColor;
    fgColor: AnsiColor;
    weight: AnsiTextWeight;
    inverted: boolean;
    underline: boolean;
    italic: boolean;
    strike: boolean;
}


export const normalStyle: AnsiStyle = {
    fgColor: new AnsiColor_3Bit(Colors.fg.DEFAULT),
    bgColor: new AnsiColor_3Bit(Colors.bg.DEFAULT),
    weight: 'normal',
    inverted: false,
    underline: false,
    italic: false,
    strike: false
};


export class AnsiStyle implements AnsiStyleData {
    public bgColor: AnsiColor;
    public fgColor: AnsiColor;
    public weight: AnsiTextWeight;
    public inverted: boolean;
    public underline: boolean;
    public italic: boolean;
    public strike: boolean;

    public constructor(style: Partial<AnsiStyle>) {

    }
}
