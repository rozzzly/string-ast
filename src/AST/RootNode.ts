import * as util from 'util';
import { stringify } from 'purdy';

import { Range } from './Range';
import { HasRaw, HasNormalized, Serializable, SerializeStrategy, defaultSerializeStrategy, Derived } from './miscInterfaces';
import { BaseNode, ComputedNode } from './BaseNode';
import { TextSpanNode } from './TextSpanNode';
import { Children, wrapChildren } from './navigation';
import { Location } from './Location';


export const RootNodeKind: 'RootNode' = 'RootNode';
export type RootNodeKind = typeof RootNodeKind;

export interface RootDataMemoizedData {

}

export class RootNode extends ComputedNode<RootNodeKind, RootDataMemoizedData> implements HasRaw, HasNormalized, Derived<RootNode> {
    public kind: RootNodeKind = RootNodeKind;
    public derivedFrom?: RootNode;
    public raw: string;
    public normalized: string;
    public children: Children<TextSpanNode>;
    public range: Range;

    public constructor(raw: string, normalized: string);
    public constructor(raw: string, normalized: string, children: TextSpanNode[]);
    public constructor(raw: string, normalized: string, children: TextSpanNode[] = []) {
        super();
        this.range = undefined;
        this.children = wrapChildren(children.map(child => child.clone(this), () => this.invalidate()));
        this.normalized = normalized;
        this.raw = raw;
    }

    public [util.inspect.custom](): string {
        const obj = this.toJSON({ mode: 'display', verbosity: 'extended' });
        return stringify(obj, { plain: false, indent: 2, depth: 8 });
    }

    public splitMultiLine(): this {
        throw new Error('Method not implemented.');
    }

    public build(): void {
        let line: number = 0;
        let column: number = 0;
        let offset: number = 0;
        let plainTextOffset: number = 0;
        this.range = new Range(
            new Location({ line, column, offset, plainTextOffset }),
            undefined
        );
        this.children.forEach(child => {
            child.calculateRange({ line, column, offset, plainTextOffset });
            line = child.range.stop.line;
            column = child.range.stop.column;
            offset = child.range.stop.offset;
            plainTextOffset = child.range.stop.plainTextOffset;
        });
        this.range.stop = new Location({ line, column, offset, plainTextOffset });
    }

    public clone(): RootNode;
    public clone(children: TextSpanNode[]): RootNode;
    public clone(children: TextSpanNode[] = undefined): RootNode {
        const result = new RootNode(
            children ? null : this.raw,
            children ? null : this.normalized,
            children ? children : this.children
        );
        result.derivedFrom = this;
        return result;
    }

    public toString(): string {
        return (this as any)[util.inspect.custom]();
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        return {
            ...super.toJSON(strategy),
            raw: this.raw,
            children: this.children.map(child => child.toJSON(strat)),
            normalized: this.normalized
        };
    }
}
