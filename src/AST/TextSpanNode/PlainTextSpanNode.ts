import { RootNode } from '../RootNode';
import { CharacterNode } from '../TextChunkNode/CharacterNode';
import { BaseTextSpanNode } from './BaseTextSpanNode';

export const PlainTextSpanNodeKind: 'PlainTextSpanNode' = 'PlainTextSpanNode';
export type PlainTextSpanNodeKind = typeof PlainTextSpanNodeKind;

export class PlainTextSpanNode extends BaseTextSpanNode<PlainTextSpanNodeKind> {
    public kind: PlainTextSpanNodeKind = PlainTextSpanNodeKind;
    public children: CharacterNode[];
    public raw: string;

    public constructor(parent: RootNode, text: string) {
        super(parent, text);
        this.raw = text;
    }
}
