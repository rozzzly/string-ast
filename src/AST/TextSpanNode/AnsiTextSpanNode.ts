import { RootNode } from '../RootNode';
import { AnsiStyle } from '../../Ansi/AnsiStyle';
import { BaseTextSpanNode, TextSpanMemoizedData } from './BaseTextSpanNode';
import { AnsiEscapeNode } from '../TextChunkNode/AnsiEscapeNode';
import { IsInvalidated, SerializeStrategy, defaultSerializeStrategy, minVerbosity } from '../miscInterfaces';
import { PlainTextChunkNode } from '../TextChunkNode';
import { Children, wrapChildren } from '../navigation';
import { Memoizer } from '../Memoizer';


export const AnsiTextSpanNodeKind: 'AnsiTextSpanNode' = 'AnsiTextSpanNode';
export type AnsiTextSpanNodeKind = typeof AnsiTextSpanNodeKind;

export interface RelatedAnsiEscapes {
    before: AnsiEscapeNode[];
    after: AnsiEscapeNode[];
}
export interface AnsiTextSpanMemoizedData extends TextSpanMemoizedData {
    raw: string;
    relatedEscapes: RelatedAnsiEscapes;
    plainTextChildren: Children<PlainTextChunkNode>;
}

const computers = {
    raw: (self: AnsiTextSpanNode) => self.children.reduce((reduction, child) => reduction + child.value, ''),
    plainTextChildren: (self: AnsiTextSpanNode) => {
        const plainTextChildren: Children<PlainTextChunkNode> = wrapChildren([]);
        self.children.forEach(child => {
            if (child.kind !== 'AnsiEscapeNode') {
                plainTextChildren.push(child);
            }
        });
        return plainTextChildren;
    },
    relatedEscapes: (self: AnsiTextSpanNode) => {
        const before: AnsiEscapeNode[] = [];
        const after: AnsiEscapeNode[] = [];
        let textReached: boolean = false;
        self.children.forEach(child => {
            if (child.kind === 'AnsiEscapeNode') {
                if (!textReached) before.push(child);
                else after.push(child);
            } else {
                textReached = true;
            }
        });
        return { before, after };
    }
};

export class AnsiTextSpanNode extends BaseTextSpanNode<AnsiTextSpanNodeKind> {
    public kind: AnsiTextSpanNodeKind = AnsiTextSpanNodeKind;
    public style: AnsiStyle;
    protected memoized: Memoizer<AnsiTextSpanMemoizedData, this>;

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
        this.memoized.patch(computers);
    }

    public get relatedEscapes(): RelatedAnsiEscapes  {
        return this.memoized.getMemoizedData('relatedEscapes');
    }

    public get raw(): string {
        return this.memoized.getMemoizedData('raw');
    }

    public get plainTextChildren(): PlainTextChunkNode[]  {
        return this.memoized.getMemoizedData('plainTextChildren');
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        const obj: any = {
            ...super.toJSON(strat),
            style: this.style.toJSON(strat)
        };

        if (strat.verbosity === 'full') {
            obj.plainTextChildren = this.plainTextChildren.map(child => child.toJSON(strat));
            const relatedEscapes = this.relatedEscapes;
            obj.relatedEscapes = {
                after: relatedEscapes.after.map(esc => esc.toJSON(strat)),
                before: relatedEscapes.before.map(esc => esc.toJSON(strat)),
            };
        }
        return obj;
    }
}