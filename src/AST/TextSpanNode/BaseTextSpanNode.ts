import * as _ from 'lodash';
import { splitText } from '../../splits';
import { RootNode } from '../RootNode';
import { BaseNode, ComputedNode } from '../BaseNode';
import { Range, CompoundRange } from '../Range';
import { TextChunkNode } from '../TextChunkNode';
import { TextSpanNode, TextSpanNodeKind } from '../TextSpanNode';
import { IsInvalidated, HasRaw, SerializeStrategy, defaultSerializeStrategy, minVerbosity, Derived } from '../miscInterfaces';
import { Children, wrapChildren } from '../navigation';
import { LocationData, Location, CompoundLocation } from '../Location';
import { Memoizer } from '../Memoizer';

export interface TextSpanMemoizedData {
    width: number;
}

const computers = {
    width: <T extends TextSpanNodeKind>(self: BaseTextSpanNode<T>) => self.children.reduce((reduction, child) => reduction + child.width, 0)
};

export abstract class BaseTextSpanNode<K extends TextSpanNodeKind> extends ComputedNode<K> implements HasRaw, Derived<TextSpanNode> {
    public abstract kind: K;
    public abstract derivedFrom?: TextSpanNode;
    public abstract raw: string;
    public text: string;
    public parent: RootNode;
    public children: Children<TextChunkNode>;
    protected memoized: Memoizer<TextSpanMemoizedData, this>;

    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, text: string, children: TextChunkNode[]);
    public constructor(parent: RootNode, text: string, children?: TextChunkNode[]) {
        super();
        if (children) {
            // @ts-ignore
            this.children = wrapChildren(children.map(child => child.clone(this)));
        } else {
            this.children = wrapChildren(splitText(text, this as any));
        }
        this.parent = parent;
        this.text = text;
        this.memoized.patch(computers);
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

    public abstract clone(): BaseTextSpanNode<K>;
    public abstract clone(overrideParent: RootNode): BaseTextSpanNode<K>;

    public toString() {
        return this.raw;
    }

    public get width(): number {
        return this.memoized.getMemoizedData('width');
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        const obj: any = {
            ...super.toJSON(strat),
            children: this.children.map(child => child.toJSON(strategy)),
        };
        if (minVerbosity(strat.verbosity, 'extended')) {
            obj.text = this.text,
            obj.width = this.width;
            if (strat.verbosity === 'full') {
                obj.raw = this.raw;
            }
        }
        return obj;
    }
}

