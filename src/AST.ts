import { AnsiStyle } from './AnsiStyle';

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
    | PlainTextChunkNode
    | AnsiTextChunkNode
    | CharacterNode
    | NewLineCharacterNode
    | AnsiEscapeNode
);

export type NodeKind = (
    | 'RootNode'
    | 'PlainTextChunkNode'
    | 'AnsiTextChunkNode'
    | 'NewLineChunkNode'
    | 'CharacterNode'
    | 'NewLineCharacterNode'
    | 'AnsiEscapeNode'
);

export interface HasRaw {
    raw: string;
}

export interface Derived {
    derivedFrom?: this;
}

export class Node<K extends NodeKind> {
    public kind: K;
    public range: Range;
    public parent: Node<NodeKind>;
    public constructor(parent: Node<NodeKind>) {
        this.parent = parent;
    }
}

export class RootNode extends Node<'RootNode'> implements HasRaw {
    public kind: 'RootNode' = 'RootNode';
    public raw: string;
    public children: ChunkNode[];
    public range: Range;

    public constructor() {
        super(undefined);
        this.range = undefined;
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
    | NewLineChunkNode
    | AnsiTextChunkNode
);

export type ChunkTypes = (
    | 'PlainTextChunkNode'
    | 'NewLineChunkNode'
    | 'AnsiTextChunkNode'
);


export abstract class BaseChunkNode<K extends ChunkTypes> extends Node<K> implements HasRaw {
    public abstract kind: K;
    public parent: RootNode;
    public children: TextUnitNode[] = [];
    public range: Range;
    public raw: string;

    public constructor(parent: RootNode, text: string) {
        super(parent);
        this.raw = text;
        //this.children = this.splitText(text);
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
            if (child.kind === 'NewLineCharacterNode') {
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

export class NewLineChunkNode extends BaseChunkNode<'NewLineChunkNode'> {
    public kind: 'NewLineChunkNode' = 'NewLineChunkNode';
    public children: NewLineCharacterNode[] = [];
}


export class PlainTextChunkNode extends BaseChunkNode<'PlainTextChunkNode'> {
    public kind: 'PlainTextChunkNode' = 'PlainTextChunkNode';
    public children: CharacterNode[] = [];
}

export class AnsiTextChunkNode extends BaseChunkNode<'AnsiTextChunkNode'> {
    public kind: 'AnsiTextChunkNode' = 'AnsiTextChunkNode';
    public style: AnsiStyle;
    public children: (CharacterNode | AnsiEscapeNode)[];

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
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
    | AnsiEscapeNode
    | CharacterNode
    | NewLineCharacterNode
);

export type TextUnitNodeKind = (
    | 'AnsiEscapeNode'
    | 'CharacterNode'
    | 'NewLineCharacterNode'
);

export abstract class BaseTextUnitNode<K extends TextUnitNodeKind> extends Node<K> {
    public abstract kind: K;
    public value: string;
    public width: number;
    public bytes: number;
    public range: CompoundRange;
    public parent: ChunkNode;
}

export class CharacterNode extends BaseTextUnitNode<'CharacterNode'> {
    public kind: 'CharacterNode' = 'CharacterNode';
}

export class AnsiEscapeNode extends BaseTextUnitNode<'AnsiEscapeNode'> {
    public kind: 'AnsiEscapeNode' = 'AnsiEscapeNode';
    public width: 0 = 0;
    public params: number[];
    public parent: AnsiTextChunkNode;
    public constructor(parent: AnsiTextChunkNode, params: number[]) {
        super(parent);
        this.params = params;
        this.value = `\u00b1[${params.join(';')}m`;
    }
}

export class NewLineCharacterNode extends BaseTextUnitNode<'NewLineCharacterNode'> {
    public kind: 'NewLineCharacterNode' = 'NewLineCharacterNode';
    public value: string;
    public width: 0 = 0;
    public parent: NewLineChunkNode;
    public constructor(parent: ChunkNode, value: string) {
        super(parent);
    }
}