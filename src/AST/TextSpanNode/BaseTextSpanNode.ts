import * as _ from 'lodash';
import { splitText } from '../../splits';
import { RootNode } from '../RootNode';
import { BaseNode } from '../BaseNode';
import { Range, Location } from '../Range';
import { TextChunkNode } from '../TextChunkNode';
import { TextSpanNode, TextSpanNodeKind } from '../TextSpanNode';
import { MemoizedData, HasMemoizedData, Serializable, HasRaw } from '../miscInterfaces';


export interface TextSpanMemoizedData {
    children: TextChunkNode[];
    width: number;
}

export abstract class BaseTextSpanNode<T extends TextSpanNodeKind, D extends TextSpanMemoizedData = TextSpanMemoizedData> extends BaseNode<T> implements HasRaw, Serializable, HasMemoizedData<D> {
    public abstract kind: T;
    public abstract raw: string;
    public parent: RootNode;
    public children: TextChunkNode[];
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
        this.setMemoizedData('width', this.width);
        this.setMemoizedData('children', [...this.children]);
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

