import * as _ from 'lodash';
import * as util  from 'util';
import { AnsiStyle } from './AnsiStyle';
import { widthOf } from './width';
import { stripAnsiEscapes } from './';
import { splitText } from './splits';

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
    | PlainTextSpanNode
    | AnsiTextSpanNode
    | CharacterNode
    | NewLineEscapeNode
    | AnsiEscapeNode
);

export type NodeKind = (
    | 'RootNode'
    | 'PlainTextSpanNode'
    | 'AnsiTextSpanNode'
    | 'CharacterNode'
    | 'NewLineEscapeNode'
    | 'AnsiEscapeNode'
);

export interface NodeLookup {
    RootNode: RootNode;
    PlainTextSpanNode: PlainTextSpanNode;
    AnsiTextSpanNode: AnsiTextSpanNode;
    CharacterNode: CharacterNode;
    NewLineEscapeNode: NewLineEscapeNode;
    AnsiEscapeNode: AnsiEscapeNode;
}

export interface Serializable {
    toJSON(): object;
    toJSON(key: string): object;
    toJSON(key?: string): object;
}

export interface HasRaw {
    raw: string;
}

export interface HasNormalized {
    normalized: string;
}

export const MemoizedData: unique symbol = Symbol('[string-ast]::Node(HasMemoizedData).MemoizedData');
export type MemoizedData = typeof MemoizedData;

export interface HasMemoizedData<D extends {}> {
    [MemoizedData]: D;
    isMemoizedDataCurrent(): boolean;
    isMemoizedDataCurrent<K extends keyof D = keyof D>(key: K): boolean;
    getMemoizedData<K extends keyof D = keyof D>(key: K): D[K];
    setMemoizedData<K extends keyof D = keyof D>(key: K, value: D[K]): void;
    updateMemoizedData(): void;
}

export interface Derived<T extends BaseNode<any>> {
    derivedFrom?: T;
}

export abstract class BaseNode<T extends NodeKind> implements Serializable {
    public abstract kind: T;
    public range: Range;
    public parent: BaseNode<NodeKind>;

    public constructor(parent: BaseNode<NodeKind>) {
        this.parent = parent;
    }


    public [util.inspect.custom]() {
        return this.toJSON();
    }

    public toJSON(): object {
        return {
            kind: this.kind,
            range: this.range
        };
    }
}

 export class RootNode extends BaseNode<'RootNode'> implements HasRaw, HasNormalized, Serializable {
    public kind: 'RootNode' = 'RootNode';
    public raw: string;
    public normalized: string;
    public children: TextSpanNode[];
    public range: Range;

    public constructor(raw: string, normalized: string) {
        super(undefined);
        this.range = undefined;
        this.raw = raw;
        this.children = [];
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

    public toJSON(): object {
        return {
            ...super.toJSON(),
            raw: this.raw,
            children: this.children,
            normalized: this.normalized
        };
    }
}


export type TextSpanNode = (
    | PlainTextSpanNode
    | AnsiTextSpanNode
);

export type TextSpanKind = (
    | 'PlainTextSpanNode'
    | 'AnsiTextSpanNode'
);



export interface TextSpanMemoizedData {
    children: TextChunkNode[];
    range: Range;
    width: number;
}

export abstract class BaseTextSpanNode<T extends TextSpanKind, D extends TextSpanMemoizedData = TextSpanMemoizedData> extends BaseNode<T> implements HasRaw, Serializable, HasMemoizedData<D> {
    public abstract kind: T;
    public parent: RootNode;
    public children: TextChunkNode[];
    // public range: Range;
    public abstract raw: string;
    public text: string;

    public [MemoizedData]: D;

    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, text: string) {
        super(parent);
        this.text = text;
        // this.raw = raw;
        this.children = splitText(text, this as TextSpanNode);
        this[MemoizedData] = {
            children: undefined,
            range: undefined,
            width: undefined
        } as any;
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

    public get range(): Range {
        if (this.isMemoizedDataCurrent('range')) return this.getMemoizedData('range');
        else {
            this.getMemoizedData('range');
        }
    }
    public set range(value: Range) {
        this.setMemoizedData('range', value);
    }

    public get width(): number {
        if (this.isMemoizedDataCurrent('width')) return this.getMemoizedData('width');
        this.setMemoizedData('width', this.children.reduce((reduction, child) => reduction + child.width, 0));
        return this.getMemoizedData('width');
    }

    public isMemoizedDataCurrent(): boolean;
    public isMemoizedDataCurrent<K extends keyof D = keyof D>(key?: K): boolean;
    public isMemoizedDataCurrent<K extends keyof D = keyof D>(key: K = undefined): boolean {
        if (this[MemoizedData].children === this.children || _.isEqual(this[MemoizedData].children, this.children)) {
            if (key && this[MemoizedData][key] !== undefined) return true;
            else return false;
        } else return false;
    }

    public setMemoizedData<K extends keyof D = keyof D>(key: K, value: D[K]): void {
        this[MemoizedData][key] = value;
    }

    public getMemoizedData<K extends keyof D = keyof D>(key: K): D[K] {
        return this[MemoizedData][key];
    }

    public updateMemoizedData(): void {
        this.setMemoizedData('range', this.range);
        this.setMemoizedData('width', this.width);
        this.setMemoizedData('children', [...this.children]);
    }

    public [util.inspect.custom](): object {
        return this.toJSON();
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            raw: this.raw,
            text: this.text,
            width: this.width,
            children: this.children,
        };
    }
}
export class PlainTextSpanNode extends BaseTextSpanNode<'PlainTextSpanNode'> {
    public kind: 'PlainTextSpanNode' = 'PlainTextSpanNode';
    public children: CharacterNode[];
    public raw: string;

    public constructor(parent: RootNode, text: string) {
        super(parent, text);
        this.raw = text;
    }
}

export interface AnsiTextSpanMemoizedData extends TextSpanMemoizedData {
    raw: string;
}

export class AnsiTextSpanNode extends BaseTextSpanNode<'AnsiTextSpanNode', AnsiTextSpanMemoizedData> implements Serializable {
    public kind: 'AnsiTextSpanNode' = 'AnsiTextSpanNode';
    public style: AnsiStyle;
    public [MemoizedData]: AnsiTextSpanMemoizedData;

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
        this[MemoizedData] = { ...this[MemoizedData], raw: undefined };
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

    public get raw(): string {
        if (this.isMemoizedDataCurrent('raw')) return this.getMemoizedData('raw');
        else {
            this.setMemoizedData('raw', this.children.reduce((reduction, child) => reduction + child.value, ''));
            return this.getMemoizedData('raw');
        }
    }
    public updateMemoizedData(): void {
        this.setMemoizedData('raw', this.raw);
        this.updateMemoizedData();
    }

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

    public toJSON(): object {
        return {
            ...super.toJSON(),
            style: this.style,
            relatedEscapes: this.relatedEscapes,
        };
    }
}

export type TextChunkNode = (
    | CharacterNode
    | AnsiEscapeNode
    | NewLineEscapeNode
);

export type TextChunkNodeKind = (
    | 'CharacterNode'
    | 'AnsiEscapeNode'
    | 'NewLineEscapeNode'
);

export abstract class BaseTextChunkNode<K extends TextChunkNodeKind> extends BaseNode<K> implements Serializable  {
    public abstract kind: K;
    public abstract width: number;
    public value: string;
    public bytes: number;
    public range: CompoundRange;
    public parent: TextSpanNode;

    public constructor(parent: TextSpanNode, value: string) {
        super(parent);
        this.value = value;
        this.bytes = value.length;
    }

    public [util.inspect.custom](): object {
        return this.toJSON();
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            bytes: this.bytes,
            width: this.width,
            value: this.value
        };
    }
}

export class CharacterNode extends BaseTextChunkNode<'CharacterNode'> {
    public kind: 'CharacterNode' = 'CharacterNode';
    public width: number;

    public constructor(parent: TextSpanNode, value: string) {
        super(parent, value);
        this.width = widthOf(value);
    }
}

export class AnsiEscapeNode extends BaseTextChunkNode<'AnsiEscapeNode'> {
    public kind: 'AnsiEscapeNode' = 'AnsiEscapeNode';
    public width: 0 = 0;
    public params: number[];
    public parent: AnsiTextSpanNode;

    public constructor(parent: AnsiTextSpanNode, params: number[]) {
        super(parent, `\u001b[${params.join(';')}m`);
        this.params = params;
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            params: this.params
        };
    }
}

export class NewLineEscapeNode extends BaseTextChunkNode<'NewLineEscapeNode'> {
    public kind: 'NewLineEscapeNode' = 'NewLineEscapeNode';
    public value: string;
    public width: 0 = 0;
    public parent: TextSpanNode;
}