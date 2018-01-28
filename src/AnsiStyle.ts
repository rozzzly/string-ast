import * as _ from 'lodash';

import { AnsiColor, Colors } from "./AnsiColor";


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


const defaultStyleData: AnsiStyleData = {
    fgColor: Colors.fg.DEFAULT,
    bgColor: Colors.bg.DEFAULT,
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

    public constructor(style: Partial<AnsiStyleData>) {
        const data = _.defaults({}, style, defaultStyleData);
        this.bgColor = data.bgColor;
        this.fgColor = data.fgColor;
        this.weight = data.weight;
        this.inverted = data.inverted;
        this.underline = data.underline;
        this.italic = data.italic;
        this.strike = data.strike;
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
}
