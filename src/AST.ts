import { AnsiStyle } from "./AnsiStyle";

export interface Location {
    offset: number;
    textOffset: number;
    line: number;
    column: number;
}

export interface CompoundLocation extends Location {
    offset: number; // global
    line: number; // global
    column: number; // global
    relative: Location; // relative to parent
}

export interface Range {
    start: Location;
    stop: Location;
}

export interface CompoundRange extends Range {
    start: CompoundLocation;
    stop: CompoundLocation;
}

export type Nodes = (
    | RootNode
    | PlainTextNode
    | AnsiTextNode
    | CharacterNode
    | NewLineNode
    | AnsiEscapeNode
);

export type NodeTypes = (
    | 'RootNode'
    | 'PlainTextNode'
    | 'AnsiTextNode'
    | 'CharacterNode'
    | 'NewLineNode'
    | 'AnsiEscapeNode'
);

export interface HasRaw {
    raw: string;
}

export interface Derived {
    derivedFrom?: this;
}

export class Node<T extends NodeTypes> {
    public type: T;
    public range: Range;
    public parent: Node<NodeTypes>;
    public constructor(parent: Node<NodeTypes>) {
        this.parent = parent;
    }
}

export type TextNode = (
    | PlainTextNode
    | AnsiTextNode
);

export type TextNodeTypes = (
    | 'PlainTextNode'
    | 'AnsiTextNode'
);

export class RootNode extends Node<'RootNode'> implements HasRaw {
    public type: 'RootNode' = 'RootNode';
    public raw: string;
    public children: TextNode[];
    public range: Range;

    public constructor() {
        super(undefined);
        this.range = undefined;
    }

    public splitMultiLine(): this {
        throw new Error("Method not implemented.");
    }

    public calculateRange(): void {
        let line: number = 0;
        let column: number = 0;
        let offset: number = 0;
        let textOffset: number = 0;
        this.range = {
            start: { line, column, offset, textOffset },
            stop: undefined
        };
        this.children.forEach(child => {
            child.calculateRange({ line, column, offset, textOffset });
            line = child.range.stop.line;
            column = child.range.stop.column;
            offset = child.range.stop.offset;
            textOffset = child.range.stop.textOffset;
        });
        this.range.stop = { line, column, offset, textOffset };
    }
}

export abstract class BaseTextNode<T extends TextNodeTypes> extends Node<T> implements HasRaw {
    public abstract type: T;
    public parent: RootNode;
    public children: TextUnitNode[] = [];
    public range: Range;

    public constructor(parent: RootNode, text: string) {
        super(parent);
        this.splitAndAppend(text);
    }

    // public get lines(): CharacterNode[][] {
    //     const result: CharacterNode[][] = [];
    //     for(let i = 0, l = 0; i < this.children.length; i++) {
    //         const current = this.children[i];
    //         if (current.type === 'NewLineNode') {
    //             l++;
    //         } else {
    //             result[l].push(current);
    //         }
    //     }
    //     return result;
    // }

    public get raw(): string {
        let result = '';
        this.children.forEach(child => result += child.value);
        return result;
    }

    public calculateRange(parentOffset: Location) {
        this.range = {
            start: {
                ...parentOffset
            },
            stop: undefined
        };
        let line: number = 0;
        let column: number = 0;
        let offset: number = 0;
        let textOffset: number = 0;
        this.children.forEach(child => {
            child.range = {
                start: {
                    line: parentOffset.line + line,
                    column: parentOffset.column + column,
                    offset: parentOffset.offset + offset,
                    textOffset: parentOffset.textOffset + textOffset,
                    relative: {
                        line, column, offset, textOffset
                    }
                },
                stop: undefined
            };
            column += child.width;
            offset += child.bytes;
            if (child.type !== 'AnsiEscapeNode') {
               textOffset += child.bytes; 
            }
            if (child.type === 'NewLineNode') {
                line++;
                column = 0;
            }
            child.range.stop = {
                line: parentOffset.line + line,
                column: parentOffset.column + column,
                offset: parentOffset.offset + offset,
                textOffset: parentOffset.textOffset + offset,
                relative: {
                    line, column, offset, textOffset
                }
            };
        });
        if (this.children.length === 0) {
            this.range.stop = {
                ...this.range.start
            };
        } else {
            this.range.stop = {
                offset: this.range.start.offset + offset,
                column: this.range.start.column + column,
                line: this.range.start.line + line,
                textOffset: this.range.start.textOffset + textOffset
            };
        }
    }

    private splitAndAppend(str: string): void {

    }
}

export class PlainTextNode extends BaseTextNode<'PlainTextNode'> { 
    public type: 'PlainTextNode' = 'PlainTextNode';
    public children: VisibleTextUnitNode[] = [];
}

export class AnsiTextNode extends BaseTextNode<'AnsiTextNode'> {
    public type: 'AnsiTextNode' = 'AnsiTextNode';
    public style: AnsiStyle;

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
    }

    public get relatedEscapes(): { before: AnsiEscapeNode[], after: AnsiEscapeNode[] }  {
        const before: AnsiEscapeNode[] = [];
        const after: AnsiEscapeNode[] = [];
        return { before, after };
    }
}

export type VisibleTextUnitNode = (
    | CharacterNode
    | NewLineNode
);

export type VisibleTextUnitNodeTypes = (
    | 'CharacterNode'
    | 'NewLineNode'
);

export type TextUnitNode = (
    | AnsiEscapeNode
    | CharacterNode
    | NewLineNode
);

export type TextUnitNodeTypes = (
    | 'AnsiEscapeNode'
    | 'CharacterNode'
    | 'NewLineNode'
);

export abstract class BaseTextUnitNode<T extends TextUnitNodeTypes> extends Node<T> {
    public abstract type: T;
    public value: string;
    public width: number;
    public bytes: number;
    public range: CompoundRange;
    public parent: TextNode;
}

export class CharacterNode extends BaseTextUnitNode<'CharacterNode'> {
    public type: 'CharacterNode' = 'CharacterNode';
    public constructor(parent: TextNode, value: string) {
        super(parent);
        this.value = value;
    }
}

export class AnsiEscapeNode extends BaseTextUnitNode<'AnsiEscapeNode'> {
    public type: 'AnsiEscapeNode' = 'AnsiEscapeNode';
    public width: 0 = 0;
    public params: number[];
    public parent: AnsiTextNode;
    public constructor(parent: AnsiTextNode, params: number[]) {
        super(parent);
        this.params = params;
        this.value = `\u00b1[${params.join(';')}m`;
    }
}

export class NewLineNode extends BaseTextUnitNode<'NewLineNode'> {
    public type: 'NewLineNode' = 'NewLineNode';
    public value: string;
    public width: 0 = 0;
    public constructor(parent: TextNode, value: string) {
        super(parent);
    }
}