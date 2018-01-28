import { RootNode } from "./AST";
import { AnsiStyle, baseStyle } from "./AnsiStyle";
import { inRange } from "./misc";
import * as codes from "./AnsiCodes";
import { parseColorCode } from "./AnsiColor";

function buildTextNode(raw: string, style: AnsiStyle): TextNode {
    
}

const ansiStyleRegex: RegExp = /(\u001b\[(?:\d+;)*\d+m)/u;
const ansiStyleParamsRegex: RegExp = /\u001b\[((?:\d+;)*\d+)m/u;

export function parse(str: string): RootNode {
    const root: RootNode = new RootNode();
    let style: AnsiStyle = baseStyle.clone();

    let raw: string = '';
    let escape: RegExpExecArray;
    let styleMutated: boolean = false;
    const parts: string[] = str.split(ansiStyleRegex); // separate plaintext and escape sequences

    parts.forEach(part => {
        if (part === '') return; // `return` is poor-man's continue
        else {
            raw += part;
            if (escape = ansiStyleParamsRegex.exec(part)) {
                let params: number[] = escape[1].split(';').map(Number);
                let safeParams: number[] = [...params]; // create a copy - error messages will be more useful if they contain the original sequence of params
                while(params.length) {
                    let current: number = params.pop();
                    if (inRange(codes.FG_START, codes.FG_END, current) || inRange(codes.FG_BRIGHT_START, codes.FG_BRIGHT_END, current)) {
                        style.fgColor = parseColorCode(current, params, safeParams);
                    } else if (inRange(codes.BG_START, codes.BG_END, current) || inRange(codes.BG_BRIGHT_START, codes.BG_BRIGHT_END, current)) {
                        style.bgColor = parseColorCode(current, params, safeParams);
                    } else if (current === codes.WEIGHT_BOLD) {
                        style.weight = 'bold';
                    } else if (current === codes.WEIGHT_FAINT) {
                        style.weight = 'faint';
                    } else if (current === codes.WEIGHT_NORMAL) {
                        style.weight = 'normal';
                    } else if (current === codes.WEIGHT_BOLD_OFF && style.weight === 'bold') {
                        // wiki article says 'bold off' but doesn't specify if it disabled faint as well,
                        // so for now, don't do anything if current weight is not `bold`
                        style.weight = 'bold';
                    } else if (current === codes.ITALIC_ON) {
                        style.italic = true;
                    } else if (current === codes.ITALIC_OFF) {
                        style.italic = false;
                    } else if (current === codes.UNDERLINED_ON) {
                        style.underline = true;
                    } else if (current === codes.UNDERLINED_OFF) {
                        style.underline = false;
                    } else if (current === codes.INVERTED_ON) {
                        style.inverted = true;
                    } else if (current === codes.INVERTED_OFF) {
                        style.inverted = false;
                    } else if (current === codes.STRIKED_ON) {
                        style.strike = true;
                    } else if (current === codes.STRIKED_OFF) {
                        style.strike = false;
                    } else if (current === codes.RESET) {
                        style = baseStyle.clone();
                    } else {
                        throw new TypeError(`Unsupported ANSI escape code SGR parameter: '${current}' in '${safeParams}'.`);
                    }
                    styleMutated = true;
                }
            } else {
                if (style.equalTo(baseStyle)) {

                }
            }
        }
    });

    return undefined;
}