import {
    Node,
    NodeKind,
    RootNode,
    NewLineChunkNode,
    AnsiTextChunkNode,
    PlainTextChunkNode,
    TextUnitNode,
    CharacterNode,
    AnsiEscapeNode,
    NewLineEscapeNode,
    NodeLookup
} from './AST';
import { AnsiStyle, baseStyle } from './AnsiStyle';
import { inRange, groupContiguous } from './misc';
import * as codes from './AnsiCodes';
import { parseColorCode } from './AnsiColor';

const newLineRegex: RegExp = /(\u000a|(?:\r?\n))/u;
const ansiStyleRegex: RegExp = /(\u001b\[(?:\d+;)*\d+m)/u;
const ansiStyleParamsRegex: RegExp = /\u001b\[((?:\d+;)*\d+)m/u;

export function normalize(raw: string): string {
    return raw.normalize('NFC');
}

export function previousNodeOfKind<K extends NodeKind>(children: Node[], kind: K): NodeLookup[K] {
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].kind === kind) return children[i];
    }
    return undefined;
}

export function hasPreviousNodeOfKind(children: Node[], kind: NodeKind): boolean {
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].kind === kind) return true;
    }
    return false;
}

export const lastNode = <K extends Node>(children: Node[]): K => (
    children.length ? children[children.length - 1] as K : undefined
);

export const isLastNodeOfKind = (children: Node[], kind: NodeKind): boolean => (
    children.length && children[children.length - 1].kind === kind
);

export const stripAnsiEscapes = (str: string): string => (
    str.split(ansiStyleRegex).reduce((reduction, part) => (
        ansiStyleRegex.test(part) ? reduction : reduction + part
    ))
);

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
                escapes.push(params);
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
                        if (!isLastNodeOfKind(root.children, 'AnsiTextChunkNode')) {
                            // append a new `AnsiEscapeNode` because one was not there already
                            root.children.push(new AnsiTextChunkNode(root, '', style));
                        }
                        const previous: AnsiTextChunkNode = lastNode(root.children);
                        // create `AnsiEscapeNodes` and attach them to previous `AnsiTextChunkNode`
                        const escapeNodes: AnsiEscapeNode[] = escapes.map(escapeParams => (
                            new AnsiEscapeNode(previous as AnsiTextChunkNode, escapeParams)
                        ));
                        previous.children.push(...escapeNodes);
                    }
                }
            } else {
                if (!escapes.length) { // this should be a `PlainTextChunkNode`
                    if (newLineRegex.test(part)) { // there are this `PlainTextChunkNode` contains one or more `NewLineChunkNode`s
                        const split = part.split(newLineRegex);
                        const built: (NewLineEscapeNode | PlainTextChunkNode)[] = [];
                        split.forEach(piece => {
                            if (newLineRegex.test(piece)) {
                                built.push(new NewLineEscapeNode(undefined, piece));
                            } else if (piece !== '') {
                                // check to make sure chunk is not empty incase of sequential new lines
                                // Example: sequential escapes:
                                //      `foo\n\nbar`.split(newLineRegex) ==> ['foo', '\n', '', '\n', 'bar']`
                                // Example: leading/trailing escapes:
                                //      `\nbar`.split(newLineRegex) ==> ['', '\n', 'bar']`
                                built.push(new PlainTextChunkNode(root, piece));
                            }
                        });
                        const grouped = groupContiguous(built, (current, previous) => (
                            current.kind === previous.kind
                        ));
                        grouped.forEach(group => {
                            if (group[0].kind === 'NewLineEscapeNode') {
                                root.children.push(new NewLineChunkNode(root, group as NewLineEscapeNode[]));
                            } else {
                                root.children.push(group[0] as PlainTextChunkNode);
                            }
                        });
                    } else {
                        root.children.push(new PlainTextChunkNode(root, part));
                    }
                } else {
                    // there are unhandled escapes, but is part has the "base" style. Let's just attach these escapes to the previous `AnsiTextChunkNode`
                    if (style.equalTo(baseStyle) && isLastNodeOfKind(root.children, 'AnsiTextChunkNode')) {
                        const previous: AnsiTextChunkNode = lastNode(root.children);
                        // create `AnsiEscapeNodes` and attach them to previous `AnsiTextChunkNode`
                        const escapeNodes: AnsiEscapeNode[] = escapes.map(params => (
                            new AnsiEscapeNode(previous as AnsiTextChunkNode, params)
                        ));
                        escapes = [];
                        root.children.push(new PlainTextChunkNode(root, part));
                    } else {
                        const node: AnsiTextChunkNode = new AnsiTextChunkNode(root, part, style);
                        const escapeNodes: AnsiEscapeNode[] = escapes.map(params => (
                            new AnsiEscapeNode(node, params)
                        ));
                        // put existing escapes before content
                        node.children.unshift(...escapeNodes); /// TODO figure out wtf this is
                        escapes = [];
                    }
                }
            }
        }
    });

    return undefined;
}