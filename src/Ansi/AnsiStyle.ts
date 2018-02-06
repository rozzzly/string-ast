import * as _ from 'lodash';

import { AnsiColor, Colors } from './AnsiColor';
import * as codes from './AnsiCodes';

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


export class AnsiStyle implements AnsiStyleData {
    public bgColor: AnsiColor;
    public fgColor: AnsiColor;
    public weight: AnsiTextWeight;
    public inverted: boolean;
    public underline: boolean;
    public italic: boolean;
    public strike: boolean;

    public constructor();
    public constructor(style: Partial<AnsiStyleData>);
    public constructor(style: Partial<AnsiStyleData> = {}) {
        const data = _.defaults({}, style, baseStyleData);
        this.bgColor = data.bgColor;
        this.fgColor = data.fgColor;
        this.weight = data.weight;
        this.inverted = data.inverted;
        this.underline = data.underline;
        this.italic = data.italic;
        this.strike = data.strike;
    }

    public getEscapeCodes(): AnsiEscapeCodePair {
        const open: number[] = [];
        const close: number[] = [];

        if (this.weight !== baseStyle.weight) {
            if (this.weight === 'normal') open.push(codes.WEIGHT_NORMAL);
            else if (this.weight === 'bold') open.push(codes.WEIGHT_BOLD);
            else if (this.weight === 'faint') open.push(codes.WEIGHT_NORMAL);
            else throw new TypeError();

            if (baseStyle.weight === 'normal') close.push(codes.WEIGHT_NORMAL);
            else if (baseStyle.weight === 'bold') close.push(codes.WEIGHT_BOLD);
            else if (baseStyle.weight === 'faint') close.push(codes.WEIGHT_FAINT);
            else throw new TypeError();
        }
        if (this.italic !== baseStyle.italic) {
            if (this.italic) {
                open.push(codes.ITALIC_ON);
                close.push(codes.ITALIC_OFF);
            } else {
                open.push(codes.ITALIC_OFF);
                close.push(codes.ITALIC_ON);
            }
        }
        if (this.underline !== baseStyle.underline) {
            if (this.underline) {
                open.push(codes.UNDERLINED_ON);
                close.push(codes.UNDERLINED_OFF);
            } else {
                open.push(codes.UNDERLINED_OFF);
                close.push(codes.UNDERLINED_ON);
            }
        }
        if (this.strike !== baseStyle.strike) {
            if (this.strike) {
                open.push(codes.STRIKED_ON);
                close.push(codes.STRIKED_OFF);
            } else {
                open.push(codes.STRIKED_OFF);
                close.push(codes.STRIKED_ON);
            }
        }
        if (this.inverted !== baseStyle.inverted) {
            if (this.inverted) {
                open.push(codes.INVERTED_ON);
                close.push(codes.INVERTED_OFF);
            } else {
                open.push(codes.INVERTED_OFF);
                close.push(codes.INVERTED_ON);
            }
        }

        if (!this.fgColor.equalTo(baseStyle.fgColor)) {
            if (this.fgColor.mode === '3-bit') open.push(this.fgColor.value);
            else if (this.fgColor.mode === '8-bit') {
                open.push(codes.FG_CUSTOM, codes.COLOR_MODE_8BIT, this.fgColor.value);
            } else if (this.fgColor.mode === '24-bit') {
                const { r, g, b } = this.fgColor.value;
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

        if (!this.bgColor.equalTo(baseStyle.bgColor)) {
            if (this.bgColor.mode === '3-bit') open.push(this.bgColor.value);
            else if (this.bgColor.mode === '8-bit') {
                open.push(codes.BG_CUSTOM, codes.COLOR_MODE_8BIT, this.bgColor.value);
            } else if (this.bgColor.mode === '24-bit') {
                const { r, g, b } = this.bgColor.value;
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
}


export const baseStyle = new AnsiStyle(baseStyleData);