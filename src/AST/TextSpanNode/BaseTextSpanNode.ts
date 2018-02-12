import * as _ from 'lodash';
import { splitText } from '../../splits';
import { RootNode } from '../RootNode';
import { BaseNode, ComputedNode } from '../BaseNode';
import { Range, Location, CompoundLocation, CompoundRange, LocationData } from '../Range';
import { TextChunkNode } from '../TextChunkNode';
import { TextSpanNode, TextSpanNodeKind } from '../TextSpanNode';
import { IsInvalidated, HasRaw, SerializeStrategy } from '../miscInterfaces';
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

    public calculateRange(parentOffset: LocationData) {
        this.range = new Range(
            new Location({
                ...parentOffset
            }),
             undefined
        );
        let line: number = 0;
        let column: number = 0;
        let offset: number = 0;
        let plainTextOffset: number = 0;
        this.children.forEach(child => {
            child.range = new CompoundRange(
                new CompoundLocation({
                    line: parentOffset.line + line,
                    column: parentOffset.column + column,
                    offset: parentOffset.offset + offset,
                    plainTextOffset: parentOffset.plainTextOffset + plainTextOffset,
                    relative: new Location({
                        line, column, offset, plainTextOffset
                    })
                }),
                undefined
            );
            column += child.width;
            offset += child.bytes;
            if (child.kind !== 'AnsiEscapeNode') {
               plainTextOffset += child.bytes;
            }
            if (child.kind === 'NewLineEscapeNode') {
                line++;
                column = 0;
            }
            child.range.stop = new CompoundLocation({
                line: parentOffset.line + line,
                column: parentOffset.column + column,
                offset: parentOffset.offset + offset,
                plainTextOffset: parentOffset.plainTextOffset + offset,
                relative: new Location({
                    line, column, offset, plainTextOffset
                })
            });
        });
        if (this.children.length === 0) {
            this.range.stop = new Location({
                ...this.range.start
            });
        } else {
            this.range.stop = new Location({
                offset: this.range.start.offset + offset,
                column: this.range.start.column + column,
                line: this.range.start.line + line,
                plainTextOffset: this.range.start.plainTextOffset + plainTextOffset
            });
        }
    }

    public toString() {
        return this.raw;
    }

    public get width(): number {
        return this.memoized.getMemoizedData('width');
    }

    public toJSON(): object;
    public toJSON(strategy: SerializeStrategy): object;
    public toJSON(strategy: SerializeStrategy = 'Data_Extended'): object {
        return {
            ...super.toJSON(strategy),
            raw: this.raw,
            text: this.text,
            width: this.width,
            children: this.children.map(child => child.toJSON(strategy)),
        };
    }
}

