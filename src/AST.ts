import { relative } from "path";

export interface Location {
    offset: number;
    line: number;
    column: number;
}

export interface CompoundLocation extends Location {
    offset: number; // global
    line: number; // global
    column: number; // global
    relative: Location // relative to parent
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
    // | 'TextNode'
    | 'PlainTextNode'
    | 'AnsiTextNode'
    | 'CharacterNode'
    | 'NewLineNode'
    | 'AnsiEscapeNode'
);

export interface HasRaw {
    raw: string;
}

export class Node<T extends NodeTypes> {
    public type: T;
    public range: Range;
    public parent: Node<NodeTypes>;
    public derivedFrom?: this;
    public constructor(parent: Node<NodeTypes>) {
        this.parent = parent;
    }
    protected updateParentRange(): void {

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
        this.range = {
            start: { line, column, offset },
            stop: undefined
        };
        this.children.forEach(child => {
            child.calculateRange({ line, column, offset });
            line = child.range.stop.line;
            column = child.range.stop.column;
            offset = child.range.stop.offset;
        });
        this.range.stop = { line, column, offset };
    }
}

export abstract class BaseTextNode<T extends TextNodeTypes> extends Node<T> implements HasRaw {
    public raw: string;
    public parent: RootNode;
    public children: VisibleCharacterNode[];
    public range: Range;
    public constructor(parent: RootNode, children: VisibleCharacterNode[]) {
        super(parent);
        this.children = children;
    }

    public get lines(): CharacterNode[][] {
        const result: CharacterNode[][] = [];
        for(let i = 0, l = 0; i < this.children.length; i++) {
            const current = this.children[i];
            if (current.type === 'NewLineNode') {
                l++;
            } else {
                result[l].push(current);
            }
        }
        return result;
    }
    public abstract splitMultiLine(): this[];

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
        this.children.forEach(child => {
            child.range = {
                start: {
                    line: parentOffset.line + line,
                    column: parentOffset.column + column,
                    offset: parentOffset.offset + offset,
                    relative: {
                        line, column, offset
                    }
                },
                stop: undefined
            };
            column += child.width;
            offset += child.bytes;
            if (child.type === 'NewLineNode') {
                line++;
                column = 0;
            }
            child.range.stop = {
                line: parentOffset.line + line,
                column: parentOffset.column + column,
                offset: parentOffset.offset + offset,
                relative: {
                    line, column, offset
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
                line: this.range.start.line + line
            };
        }
    }
}

export class PlainTextNode extends BaseTextNode<'PlainTextNode'> { 

    public splitMultiLine(): this[] {
        throw new Error("Method not implemented.");
    }
}

export class AnsiTextNode extends BaseTextNode<'AnsiTextNode'> {
    public open: AnsiEscapeNode;
    public close: AnsiEscapeNode;
    public splitMultiLine(): this[] {
        throw new Error("Method not implemented.");
    }
}

export type CharacterNodeTypes = (
    | 'CharacterNode'
    | 'NewLineNode'
    | 'AnsiEscapeNode'
);

export type VisibleCharacterNode = (
    | CharacterNode
    | NewLineNode
);

export type VisibleCharacterNodeTypes = (
    | 'CharacterNode'
    | 'NewLineNode'
);
export class CharacterNode<T extends CharacterNodeTypes = 'CharacterNode'> extends Node<T> {
    public value: string;
    public width: number;
    public bytes: number;
    public range: CompoundRange;
    public constructor(parent: TextNode, value: string) {
        super(parent);
        this.value = value;
    }
}

export class NewLineNode extends CharacterNode<'NewLineNode'> {
    public width: 0;
    public constructor(parent: TextNode, value: string) {
        super(parent, value);
        this.width = 0;
    }
}
export class AnsiEscapeNode extends CharacterNode<'AnsiEscapeNode'> {
    public params: number[];
    public width: 0;
    public constructor(parent: TextNode, value: string) {
        super(parent, value);
        this.width = 0;
    }
}