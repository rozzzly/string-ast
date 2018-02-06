import { Range } from './Range';
import { HasRaw, HasNormalized, Serializable } from './miscInterfaces';
import { BaseNode } from './BaseNode';
import { TextSpanNode } from './TextSpanNode';


export const RootNodeKind: 'RootNode' = 'RootNode';
export type RootNodeKind = typeof RootNodeKind;

export class RootNode extends BaseNode<RootNodeKind> implements HasRaw, HasNormalized, Serializable {
    public kind: RootNodeKind = RootNodeKind;
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
