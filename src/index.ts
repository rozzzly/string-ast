import * as codes from './Ansi/AnsiCodes';
import { RootNode } from './AST/RootNode';
import { AnsiEscapeNode } from './AST/TextChunkNode/AnsiEscapeNode';
import { PlainTextSpanNode } from './AST/TextSpanNode/PlainTextSpanNode';
import { Node, NodeKind, NodeLookup } from './AST';
import { AnsiStyle, baseStyle } from './Ansi/AnsiStyle';
import { inRange, groupContiguous } from './misc';
import { parseColorCode } from './Ansi/AnsiColor';
import { ansiStyleRegex, normalize, ansiStyleParamsRegex } from './Ansi/utils';
import { AnsiTextSpanNode } from './AST/TextSpanNode/AnsiTextSpanNode';
import { isLastNodeOfKind, lastNode } from './AST/navigation';

export function parse(str: string): RootNode {
    const normalized = normalize(str);
    const root: RootNode = new RootNode(str, normalized);
    let style: AnsiStyle = baseStyle.clone();

    let raw: string = '';
    let escape: RegExpExecArray;
    const parts: string[] = normalized.split(ansiStyleRegex); // separate plaintext and escape sequences
    let escapes: number[][] = [];
    parts.forEach((part: string, index: number) => {
        if (part === '') return; // `return` is poor-man's continue
        else {
            raw += part;
            if (escape = ansiStyleParamsRegex.exec(part)) {
                let params: number[] = escape[1].split(';').map(Number);
                let safeParams: number[] = [...params]; // create a copy - error messages will be more useful if they contain the original sequence of params
                escapes.push(safeParams);
                while (params.length) {
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
                    if (parts.length === index - 1) { // this is the last part (ie: string ends with ANSI escape sequence)
                        // ensure `RootNode` ends in a `AnsiEscapeNode`
                        if (!isLastNodeOfKind(root.children, 'AnsiTextSpanNode')) {
                            // append a new `AnsiEscapeNode` because one was not there already
                            root.children.push(new AnsiTextSpanNode(root, '', style));
                        }
                        const previous: AnsiTextSpanNode = lastNode(root.children);
                        // create `AnsiEscapeNodes` and attach them to previous `AnsiTextChunkNode`
                        const escapeNodes: AnsiEscapeNode[] = escapes.map(escapeParams => (
                            new AnsiEscapeNode(previous, escapeParams)
                        ));
                        previous.children.push(...escapeNodes);
                    }
                }
            } else {
                if (!escapes.length) { // this should be a `PlainTextChunkNode`
                    root.children.push(new PlainTextSpanNode(root, part));
                } else {
                    // there are unhandled escapes, but is part has the "base" style. Let's just attach these escapes to the previous `AnsiTextChunkNode`
                    if (style.equalTo(baseStyle) && isLastNodeOfKind(root.children, 'AnsiTextSpanNode')) {
                        const previous: AnsiTextSpanNode = lastNode(root.children);
                        // create `AnsiEscapeNodes` and attach them to previous `AnsiTextChunkNode`
                        const escapeNodes: AnsiEscapeNode[] = escapes.map(params => (
                            new AnsiEscapeNode(previous as AnsiTextSpanNode, params)
                        ));
                        previous.children.push(...escapeNodes);
                        root.children.push(new PlainTextSpanNode(root, part));
                        escapes = [];
                    } else {
                        const node: AnsiTextSpanNode = new AnsiTextSpanNode(root, part, style);
                        const escapeNodes: AnsiEscapeNode[] = escapes.map(params => (
                            new AnsiEscapeNode(node, params)
                        ));
                        // put existing escapes before content
                        node.children.unshift(...escapeNodes);
                        root.children.push(node);
                        escapes = [];
                    }
                }
            }
        }
    });
    root.calculateRange();

    return root;
}