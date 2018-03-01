import * as util from 'util';
import { stringify } from 'purdy';

import { Range } from './Range';
import { HasRaw, HasNormalized, Serializable, SerializeStrategy, defaultSerializeStrategy, Derived } from './miscInterfaces';
import { BaseNode } from './BaseNode';
import { TextSpanNode } from './TextSpanNode';
import { Children, wrapChildren } from './navigation';
import { Location } from './Location';


export const RootNodeKind: 'RootNode' = 'RootNode';
export type RootNodeKind = typeof RootNodeKind;

export class RootNode extends BaseNode<RootNodeKind> implements HasRaw, HasNormalized, Derived<RootNode> {
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
        this.raw = raw;
        if (children) {
            this.children = wrapChildren(children.map(child => child.clone(this)));
        } else {
            this.children = wrapChildren([]);
        }
        this.normalized = normalized;
    }

    public [util.inspect.custom](): string {
        const obj = this.toJSON({ mode: 'display', verbosity: 'extended' });
        return stringify(obj, { plain: false, indent: 2, depth: 8 });
    }

    public splitMultiLine(): this {
        throw new Error('Method not implemented.');
    }

    public calculateRange(): void {
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
    public clone(children?: TextSpanNode[]): RootNode {
        const result = new RootNode(this.raw, this.normalized, children ? children : this.children);
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
