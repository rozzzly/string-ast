import { BaseTextChunkNode } from './BaseTextChunkNode';
import { TextSpanNode } from '../TextSpanNode';
import { PlainTextSpanNode } from '../TextSpanNode/PlainTextSpanNode';
import { AnsiTextSpanNode } from '../TextSpanNode/AnsiTextSpanNode';

export const NewLineEscapeNodeKind: 'NewLineEscapeNode' = 'NewLineEscapeNode';
export type NewLineEscapeNodeKind = typeof NewLineEscapeNodeKind;

export class NewLineEscapeNode extends BaseTextChunkNode<NewLineEscapeNodeKind> {
    public kind: NewLineEscapeNodeKind = NewLineEscapeNodeKind;
    public value: string;
    public width: 0 = 0;

    public clone(): NewLineEscapeNode;
    public clone(overrideParent: PlainTextSpanNode | AnsiTextSpanNode): NewLineEscapeNode;
    public clone(overrideParent?: PlainTextSpanNode | AnsiTextSpanNode): NewLineEscapeNode {
        return new NewLineEscapeNode(overrideParent || this.parent, this.value);
    }
}

