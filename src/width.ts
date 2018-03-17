import { normalize, stripAnsiEscapes } from './Ansi/utils';
import * as stringWidth from 'string-width';
import { splitText } from './splits';


export const purify = (str: string) => (
    stripAnsiEscapes(normalize(str))
);

export function widthOf(str: string): number {
    const pureStr = purify(str);
    return stringWidth(pureStr);
}

export function plainTextLengthOf(str: string): number {
    const pureStr = purify(str);
    return pureStr.length;
}

export function chunksOf(str: string): number {
    const pureStr = purify(str);
    const chunks = splitText(pureStr, undefined);
    return chunks.length;
}