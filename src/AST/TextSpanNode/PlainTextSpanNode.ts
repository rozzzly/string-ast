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

    public constructor(parent: RootNode, text: string);
    public constructor(parent: RootNode, children: PlainTextChunkNode[]);
    public constructor(parent: RootNode, content: string | PlainTextChunkNode[]) {
        super(parent, content as any);
    }
 
    public clone(): PlainTextSpanNode;
    public clone(parent: RootNode): PlainTextSpanNode;
    public clone(parent: RootNode, text: string): PlainTextSpanNode;
    public clone(parent: RootNode, children: PlainTextChunkNode[]): PlainTextSpanNode;
    public clone(parent: RootNode = this.parent, content: string | PlainTextChunkNode[] = this.children): PlainTextSpanNode {
        const result = new PlainTextSpanNode(parent, content as any);
        result.derivedFrom = this;
        return result;
    }
}
