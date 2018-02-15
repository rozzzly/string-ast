import * as _ from 'lodash';

import { AnsiColor, Colors } from './AnsiColor';
import * as codes from './AnsiCodes';
import { SerializeStrategy, defaultSerializeStrategy } from '../AST/miscInterfaces';
import { Memoizer, memoizeClass } from '../AST/Memoizer';

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


const baseStyleData: AnsiStyleData = {
    fgColor: Colors.fg.DEFAULT,
    bgColor: Colors.bg.DEFAULT,
    weight: 'normal',
    inverted: false,
    underline: false,
    italic: false,
    strike: false
};

export interface AnsiEscapeCodePair {
    open: string;
    close: string;
}


export interface AnsiStyleMemoizedData {
   escapeCodes: AnsiEscapeCodePair;
}

const computers = {
    escapeCodes: (self: AnsiStyle): AnsiEscapeCodePair => {
        const open: number[] = [];
        const close: number[] = [];

        if (self.weight !== baseStyle.weight) {
            if (self.weight === 'normal') open.push(codes.WEIGHT_NORMAL);
            else if (self.weight === 'bold') open.push(codes.WEIGHT_BOLD);
            else if (self.weight === 'faint') open.push(codes.WEIGHT_NORMAL);
            else throw new TypeError();

            if (baseStyle.weight === 'normal') close.push(codes.WEIGHT_NORMAL);
            else if (baseStyle.weight === 'bold') close.push(codes.WEIGHT_BOLD);
            else if (baseStyle.weight === 'faint') close.push(codes.WEIGHT_FAINT);
            else throw new TypeError();
        }
        if (self.italic !== baseStyle.italic) {
            if (self.italic) {
                open.push(codes.ITALIC_ON);
                close.push(codes.ITALIC_OFF);
            } else {
                open.push(codes.ITALIC_OFF);
                close.push(codes.ITALIC_ON);
            }
        }
        if (self.underline !== baseStyle.underline) {
            if (self.underline) {
                open.push(codes.UNDERLINED_ON);
                close.push(codes.UNDERLINED_OFF);
            } else {
                open.push(codes.UNDERLINED_OFF);
                close.push(codes.UNDERLINED_ON);
            }
        }
        if (self.strike !== baseStyle.strike) {
            if (self.strike) {
                open.push(codes.STRIKED_ON);
                close.push(codes.STRIKED_OFF);
            } else {
                open.push(codes.STRIKED_OFF);
                close.push(codes.STRIKED_ON);
            }
        }
        if (self.inverted !== baseStyle.inverted) {
            if (self.inverted) {
                open.push(codes.INVERTED_ON);
                close.push(codes.INVERTED_OFF);
            } else {
                open.push(codes.INVERTED_OFF);
                close.push(codes.INVERTED_ON);
            }
        }

        if (!self.fgColor.equalTo(baseStyle.fgColor)) {
            if (self.fgColor.mode === '3-bit') open.push(self.fgColor.value);
            else if (self.fgColor.mode === '8-bit') {
                open.push(codes.FG_CUSTOM, codes.COLOR_MODE_8BIT, self.fgColor.value);
            } else if (self.fgColor.mode === '24-bit') {
                const { r, g, b } = self.fgColor.value;
                open.push(codes.FG_CUSTOM, codes.COLOR_MODE_24BIT, r, g, b);
            }

            if (baseStyle.fgColor.mode === '3-bit') close.push(baseStyle.fgColor.value);
            else if (baseStyle.fgColor.mode === '8-bit') {
                close.push(codes.FG_CUSTOM, codes.COLOR_MODE_8BIT, baseStyle.fgColor.value);
            } else if (baseStyle.fgColor.mode === '24-bit') {
                const { r, g, b } = baseStyle.fgColor.value;
                close.push(codes.FG_CUSTOM, codes.COLOR_MODE_24BIT, r, g, b);
            }
        }

        if (!self.bgColor.equalTo(baseStyle.bgColor)) {
            if (self.bgColor.mode === '3-bit') open.push(self.bgColor.value);
            else if (self.bgColor.mode === '8-bit') {
                open.push(codes.BG_CUSTOM, codes.COLOR_MODE_8BIT, self.bgColor.value);
            } else if (self.bgColor.mode === '24-bit') {
                const { r, g, b } = self.bgColor.value;
                open.push(codes.BG_CUSTOM, codes.COLOR_MODE_24BIT, r, g, b);
            }

            if (baseStyle.bgColor.mode === '3-bit') close.push(baseStyle.bgColor.value);
            else if (baseStyle.bgColor.mode === '8-bit') {
                close.push(codes.BG_CUSTOM, codes.COLOR_MODE_8BIT, baseStyle.bgColor.value);
            } else if (baseStyle.bgColor.mode === '24-bit') {
                const { r, g, b } = baseStyle.bgColor.value;
                close.push(codes.BG_CUSTOM, codes.COLOR_MODE_24BIT, r, g, b);
            }
        }

        return {
            open: open.length ? `\u00b1[${open.join(';')}m` : '',
            close: close.length ? `\u00b1[${close.join(';')}m` : ''
        };
    }
}

@memoizeClass(computers)
export class AnsiStyle implements AnsiStyleData{

    public bgColor: AnsiColor;
    public fgColor: AnsiColor;
    public weight: AnsiTextWeight;
    public inverted: boolean;
    public underline: boolean;
    public italic: boolean;
    public strike: boolean;

    private memoized: Memoizer<AnsiStyleMemoizedData, AnsiStyle>;

    public constructor();
    public constructor(style: Partial<AnsiStyleData>);
    public constructor(style: Partial<AnsiStyleData> = {}) {
        const data = { ...baseStyleData, ...style };
        this.bgColor = data.bgColor;
        this.fgColor = data.fgColor;
        this.weight = data.weight;
        this.inverted = data.inverted;
        this.underline = data.underline;
        this.italic = data.italic;
        this.strike = data.strike;
        this.memoized = new Memoizer(this);
    }

    public get escapeCodes(): AnsiEscapeCodePair {
        return this.memoized.getMemoizedData('escapeCodes');
    }

    public get bold(): boolean {
        return this.weight === 'bold';
    }

    public get faint(): boolean {
        return this.weight === 'bold';
    }

    public clone(): AnsiStyle {
        return new AnsiStyle({
            bgColor: this.bgColor.clone(),
            fgColor: this.fgColor.clone(),
            weight: this.weight,
            inverted: this.inverted,
            underline: this.underline,
            italic: this.italic,
            strike: this.strike
        });
    }

    public equalTo(other: AnsiStyle): boolean {
        return (
            this.fgColor.equalTo(other.fgColor)
            && this.bgColor.equalTo(other.bgColor)
            && this.weight === other.weight
            && this.italic === other.italic
            && this.underline === other.underline
            && this.inverted === other.inverted
            && this.strike === other.strike
        );
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        const obj: any = {
            bgColor: this.bgColor.toString(),
            fgColor: this.fgColor.toString(),
            weight: this.weight,
            underline: this.weight,
            italic: this.italic,
            strike: this.strike
        };

        if (strat.verbosity === 'full') {
            obj.bold = this.bold;
            obj.faint = this.faint;
            const esc = this.escapeCodes;
            obj.escapeCodes = strat.mode === 'display' ? { open: esc.open, close: esc.close } : esc;
        }
        return obj;
    }

    public invalidate(): void {
        this.memoized.invalidate();
    }
}


export const baseStyle = new AnsiStyle(baseStyleData);