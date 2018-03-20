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
    text: string;
    raw: string;
}

const computers = {
    raw:  <T extends TextSpanNodeKind>(self: BaseTextSpanNode<T>) => self.children.reduce((reduction, child) => reduction + child.value, ''),
    text: <T extends TextSpanNodeKind>(self: BaseTextSpanNode<T>) => self.children.reduce((reduction, child) => reduction + child.value, ''),
    width: <T extends TextSpanNodeKind>(self: BaseTextSpanNode<T>) => self.children.reduce((reduction, child) => reduction + child.width, 0)
};

export abstract class BaseTextSpanNode<K extends TextSpanNodeKind> extends ComputedNode<K> implements HasRaw, Derived<TextSpanNode> {
    public abstract kind: K;
    public abstract derivedFrom?: TextSpanNode;
    public parent: RootNode;
    public children: Children<TextChunkNode>;
    protected memoized: Memoizer<TextSpanMemoizedData, this>;

    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, children: TextChunkNode[]);
    public constructor(parent: RootNode, content: string | TextChunkNode[]) {
        super();
        this.parent = parent;
        this.memoized.patch(computers);
        if (typeof content === 'string') {
            this.children = wrapChildren(splitText(content, this as any));
            this.text = content;
            this.raw = content;
        } else {
            // @ts-ignore
            this.children = wrapChildren(children.map(child => child.clone(this)));
            this.text = null;
            this.raw = null;
        }
    }

    public set raw(raw: string | null) {
        ((raw === null)
            ? this.memoized.invalidate('raw')
            : this.memoized.set('raw', raw)
        );
    }
    public get raw(): string {
        return this.memoized.get('raw');
    }

    public set text(text: string | null) {
        ((text === null)
            ? this.memoized.invalidate('text')
            : this.memoized.set('text', text)
        );
    }

    public get text(): string {
        return this.memoized.get('text');
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
    public abstract clone(parent: RootNode): BaseTextSpanNode<K>;
    public abstract clone(parent: RootNode, text: string): BaseTextSpanNode<K>;
    public abstract clone(parent: RootNode, children: TextChunkNode[]): BaseTextSpanNode<K>;

    public toString() {
        return this.raw;
    }

    public get width(): number {
        return this.memoized.get('width');
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        const obj: any = {
            ...super.toJSON(strat),
            children: this.children.map(child => child.toJSON(strategy)),
        };
        obj.text = this.text;
        if (minVerbosity(strat.verbosity, 'extended')) {
            obj.raw = this.raw;
            obj.width = this.width;
        }
        return obj;
    }
}

