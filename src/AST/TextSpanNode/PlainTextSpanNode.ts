import { RootNode } from '../RootNode';
import { CharacterNode } from '../TextChunkNode/CharacterNode';
import { BaseTextSpanNode } from './BaseTextSpanNode';
import { NewLineEscapeNode } from '../TextChunkNode/NewLineEscapeNode';
import { PlainTextChunkNode } from '../TextChunkNode';
import { Children, wrapChildren } from '../navigation';
import { Derived } from '../miscInterfaces';

export const PlainTextSpanNodeKind: 'PlainTextSpanNode' = 'PlainTextSpanNode';
export type PlainTextSpanNodeKind = typeof PlainTextSpanNodeKind;

export class PlainTextSpanNode extends BaseTextSpanNode<PlainTextSpanNodeKind> implements Derived<PlainTextSpanNode> {
    public parent: RootNode;
    public derivedFrom?: PlainTextSpanNode;
    public kind: PlainTextSpanNodeKind = PlainTextSpanNodeKind;
    public children: Children<PlainTextChunkNode>;
    public raw: string;

    public constructor(parent: RootNode, text: string) {
        super(parent, text);
        this.raw = text;
    }

    public clone(): PlainTextSpanNode;
    public clone(overrideParent: RootNode): PlainTextSpanNode;
    public clone(overrideParent?: RootNode): PlainTextSpanNode {
        const result = new PlainTextSpanNode(overrideParent || this.parent, this.raw);
        result.derivedFrom = this;
        return result;
    }
}
