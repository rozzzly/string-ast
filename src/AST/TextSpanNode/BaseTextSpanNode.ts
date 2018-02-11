import * as _ from 'lodash';
import { splitText } from '../../splits';
import { RootNode } from '../RootNode';
import { BaseNode, ComputedNode } from '../BaseNode';
import { Range, Location } from '../Range';
import { TextChunkNode } from '../TextChunkNode';
import { TextSpanNode, TextSpanNodeKind } from '../TextSpanNode';
import { IsInvalidated, HasRaw } from '../miscInterfaces';
import { Children, wrapChildren } from '../navigation';


export interface TextSpanMemoizedData {
    width: number;
}
export abstract class BaseTextSpanNode<T extends TextSpanNodeKind, D extends TextSpanMemoizedData = TextSpanMemoizedData> extends ComputedNode<T, D> implements HasRaw {
    public abstract kind: T;
    public abstract raw: string;
    public parent: RootNode;
    public children: Children<TextChunkNode>;
    public text: string;

    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, text: string) {
        super();
        this.children = wrapChildren(splitText(text, this as any));
        this.memoized.computers.width = () => this.children.reduce((reduction, child) => reduction + child.width, 0);
        this.parent = parent;
        this.text = text;
        // this.raw = raw;
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
        return this.memoized.getMemoizedData('width');
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            raw: this.raw,
            text: this.text,
            width: this.width,
            children: this.children.map(child => child.toJSON()),
        };
    }
}

