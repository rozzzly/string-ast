import { RootNode } from '../RootNode';
import { CharacterNode } from '../TextChunkNode/CharacterNode';
import { BaseTextSpanNode } from './BaseTextSpanNode';
import { NewLineEscapeNode } from '../TextChunkNode/NewLineEscapeNode';
import { PlainTextChunkNode } from '../TextChunkNode';
import { Children, wrapChildren } from '../navigation';

export const PlainTextSpanNodeKind: 'PlainTextSpanNode' = 'PlainTextSpanNode';
export type PlainTextSpanNodeKind = typeof PlainTextSpanNodeKind;

export class PlainTextSpanNode extends BaseTextSpanNode<PlainTextSpanNodeKind> {
    public kind: PlainTextSpanNodeKind = PlainTextSpanNodeKind;
    public children: Children<PlainTextChunkNode>;
    public raw: string;

    public constructor(parent: RootNode, text: string) {
        super(parent, text);
        this.raw = text;
    }
}