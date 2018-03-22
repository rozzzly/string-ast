import { RootNode } from '../RootNode';
import { AnsiStyle } from '../../Ansi/AnsiStyle';
import { BaseTextSpanNode, TextSpanMemoizedData } from './BaseTextSpanNode';
import { AnsiEscapeNode } from '../TextChunkNode/AnsiEscapeNode';
import { SerializeStrategy, defaultSerializeStrategy, minVerbosity, Derived } from '../miscInterfaces';
import { PlainTextChunkNode, TextChunkNode } from '../TextChunkNode';
import { Children, wrapChildren } from '../navigation';
import { Memoizer, ComputerMap } from '../Memoizer';


export const AnsiTextSpanNodeKind: 'AnsiTextSpanNode' = 'AnsiTextSpanNode';
export type AnsiTextSpanNodeKind = typeof AnsiTextSpanNodeKind;

export interface RelatedAnsiEscapes {
    before: AnsiEscapeNode[];
    after: AnsiEscapeNode[];
}

export interface RelatedAnsiEscapesResult extends RelatedAnsiEscapes {
    clone(): RelatedAnsiEscapes;
    clone(parent: AnsiTextSpanNode): RelatedAnsiEscapes;
}

export interface AnsiTextSpanMemoizedData extends TextSpanMemoizedData {
    relatedEscapes: RelatedAnsiEscapesResult;
    plainTextChildren: Children<PlainTextChunkNode>;
}

export class AnsiTextSpanNode extends BaseTextSpanNode<AnsiTextSpanNodeKind> implements Derived<AnsiTextSpanNode> {
    public kind: AnsiTextSpanNodeKind = AnsiTextSpanNodeKind;
    public derivedFrom?: AnsiTextSpanNode;
    public style: AnsiStyle;

    protected static get computers(): ComputerMap<AnsiTextSpanMemoizedData, AnsiTextSpanNode> {
        return {
            ...super.computers,
            text: (self: AnsiTextSpanNode) => self.plainTextChildren.reduce((reduction, child) => reduction + child.value, ''),
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
                return {
                    before,
                    after,
                    clone: (parent: AnsiTextSpanNode = undefined) => ({
                        before: before.map(node => node.clone(parent)),
                        after: before.map(node => node.clone(parent))
                    })
                };
            }
        };
    }

    protected memoized: Memoizer<AnsiTextSpanMemoizedData, this>;

    public constructor(parent: RootNode, text: string, style: AnsiStyle);
    public constructor(parent: RootNode, children: TextChunkNode[], style: AnsiStyle);
    public constructor(parent: RootNode, content: string | TextChunkNode[], style: AnsiStyle) {
        super(parent, content as any);
        this.style = style;
    }

    public get relatedEscapes(): RelatedAnsiEscapesResult  {
        return this.memoized.get('relatedEscapes');
    }


    public get plainTextChildren(): Children<PlainTextChunkNode>  {
        return this.memoized.get('plainTextChildren');
    }

    public clone(): AnsiTextSpanNode;
    public clone(parent: RootNode): AnsiTextSpanNode;
    public clone(parent: RootNode, text: string): AnsiTextSpanNode;
    public clone(parent: RootNode, children: TextChunkNode[]): AnsiTextSpanNode;
    public clone(parent: RootNode = this.parent, content: string | TextChunkNode[] = this.children): AnsiTextSpanNode {
        const result = new AnsiTextSpanNode(parent, content as any, this.style.clone());
        result.derivedFrom = this;
        return result;
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