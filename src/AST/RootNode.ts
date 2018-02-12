import * as util from 'util';
import { stringify } from 'purdy';

import { Range, Location } from './Range';
import { HasRaw, HasNormalized, Serializable, SerializeStrategy } from './miscInterfaces';
import { BaseNode } from './BaseNode';
import { TextSpanNode } from './TextSpanNode';
import { Children, wrapChildren } from './navigation';


export const RootNodeKind: 'RootNode' = 'RootNode';
export type RootNodeKind = typeof RootNodeKind;

export class RootNode extends BaseNode<RootNodeKind> implements HasRaw, HasNormalized {
    public kind: RootNodeKind = RootNodeKind;
    public raw: string;
    public normalized: string;
    public children: Children<TextSpanNode>;
    public range: Range;

    public constructor(raw: string, normalized: string) {
        super();
        this.range = undefined;
        this.raw = raw;
        this.children = wrapChildren([]);
        this.normalized = normalized;
    }

    public [util.inspect.custom](): string {
        const obj = this.toJSON('Display_Extended');
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

    public toString(): string {
        return (this as any)[util.inspect.custom]();
    }

    public toJSON(): object;
    public toJSON(strategy: SerializeStrategy): object;
    public toJSON(strategy: SerializeStrategy = 'Display_Extended'): object {
        return {
            ...super.toJSON(strategy),
            raw: this.raw,
            children: this.children.map(child => child.toJSON(strategy)),
            normalized: this.normalized
        };
    }
}
