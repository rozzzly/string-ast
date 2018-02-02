import { AnsiStyle } from './AnsiStyle';
import { widthOf } from './width';
import { stripAnsiEscapes } from '.';

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

export type Node = (
    | RootNode
    | PlainTextChunkNode
    | AnsiTextChunkNode
    | NewLineChunkNode
    | CharacterNode
    | NewLineEscapeNode
    | AnsiEscapeNode
);

export type NodeKind = (
    | 'RootNode'
    | 'PlainTextChunkNode'
    | 'AnsiTextChunkNode'
    | 'CharacterNode'
    | 'NewLineEscapeNode'
    | 'AnsiEscapeNode'
);

export interface NodeLookup {
    RootNode: RootNode;
    PlainTextChunkNode: PlainTextChunkNode;
    AnsiTextChunkNode: AnsiTextChunkNode;
    CharacterNode: CharacterNode;
    NewLineEscapeNode: NewLineEscapeNode;
    AnsiEscapeNode: AnsiEscapeNode;
}

export interface HasRaw {
    raw: string;
}

export interface HasNormalized {
    normalized: string;
}

export interface Derived<T extends BaseNode<any>> {
    derivedFrom?: T;
}

export abstract class BaseNode<K extends NodeKind> {
    public abstract kind: K;
    public range: Range;
    public parent: BaseNode<NodeKind>;

    public constructor(parent: BaseNode<NodeKind>) {
        this.parent = parent;
    }
}

 export class RootNode extends BaseNode<'RootNode'> implements HasRaw, HasNormalized {
    public kind: 'RootNode' = 'RootNode';
    public raw: string;
    public normalized: string;
    public children: ChunkNode[];
    public range: Range;

    public constructor(raw: string, normalized: string) {
        super(undefined);
        this.range = undefined;
        this.raw = raw;
        this.normalized = normalized;
    }

    public splitMultiLine(): this {
        throw new Error('Method not implemented.');
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


export type ChunkNode = (
    | PlainTextChunkNode
    | AnsiTextChunkNode
);

export type ChunkTypes = (
    | 'PlainTextChunkNode'
    | 'AnsiTextChunkNode'
);


export abstract class BaseChunkNode<K extends ChunkTypes> extends BaseNode<K> implements HasRaw {
    public abstract kind: K;
    public parent: RootNode;
    public children: TextUnitNode[] = [];
    public range: Range;
    public raw: string;
    public text: string;

    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, text: string, raw: string);
    public constructor(parent: RootNode, text: string, raw: string = text) {
        super(parent);
        this.text = text;
        this.raw = raw;
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
            if (child.kind !== 'AnsiEscapeNode') {
               textOffset += child.bytes;
            }
            if (child.kind === 'NewLineEscapeNode') {
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

    public toString() {
        return this.raw;
    }
}
export class PlainTextChunkNode extends BaseChunkNode<'PlainTextChunkNode'> {
    public kind: 'PlainTextChunkNode' = 'PlainTextChunkNode';
    public children: CharacterNode[] = [];

    public constructor(parent: RootNode, text: string) {
        super(parent, text);
    }
}

export class AnsiTextChunkNode extends BaseChunkNode<'AnsiTextChunkNode'> {
    public kind: 'AnsiTextChunkNode' = 'AnsiTextChunkNode';
    public style: AnsiStyle;
    public children: (CharacterNode | AnsiEscapeNode)[];

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
        this.text = stripAnsiEscapes(this.text);
    }

    /// TODO ::: proxyify `this.children` to recompute `raw`
    /// when new children are appended

    // public get raw(): string {
    //     let result = '';
    //     this.children.forEach(child => {
    //         if (child.type === 'AnsiEscapeNode') {
    //             result += child.value;
    //         }
    //         result += child.value
    //     });
    //     return result;
    // }

    public get relatedEscapes(): { before: AnsiEscapeNode[], after: AnsiEscapeNode[] }  {
        const before: AnsiEscapeNode[] = [];
        const after: AnsiEscapeNode[] = [];
        let textReached: boolean = false;
        this.children.forEach(child => {
            if (child.kind === 'AnsiEscapeNode') {
                if (textReached) after.push(child);
                else before.push(child);
            } else {
                textReached = true;
            }
        });
        return { before, after };
    }
}

export type TextUnitNode = (
    | CharacterNode
    | AnsiEscapeNode
    | NewLineEscapeNode
);

export type TextUnitNodeKind = (
    | 'CharacterNode'
    | 'AnsiEscapeNode'
    | 'NewLineEscapeNode'
);

export abstract class BaseTextUnitNode<K extends TextUnitNodeKind> extends BaseNode<K> {
    public abstract kind: K;
    public abstract width: number;
    public value: string;
    public bytes: number;
    public range: CompoundRange;
    public parent: ChunkNode;

    public constructor(parent: ChunkNode, value: string) {
        super(parent);
        this.value = value;
        this.bytes = value.length;
    }
}

export class CharacterNode extends BaseTextUnitNode<'CharacterNode'> {
    public kind: 'CharacterNode' = 'CharacterNode';
    public width: number;

    public constructor(parent: ChunkNode, value: string) {
        super(parent, value);
        this.width = widthOf(value);
    }
}

export class AnsiEscapeNode extends BaseTextUnitNode<'AnsiEscapeNode'> {
    public kind: 'AnsiEscapeNode' = 'AnsiEscapeNode';
    public width: 0 = 0;
    public params: number[];
    public parent: AnsiTextChunkNode;
    public constructor(parent: AnsiTextChunkNode, params: number[]) {
        super(parent, `\u00b1[${params.join(';')}m`);
        this.params = params;
    }
}

export class NewLineEscapeNode extends BaseTextUnitNode<'NewLineEscapeNode'> {
    public kind: 'NewLineEscapeNode' = 'NewLineEscapeNode';
    public value: string;
    public width: 0 = 0;
    public parent: ChunkNode;
}