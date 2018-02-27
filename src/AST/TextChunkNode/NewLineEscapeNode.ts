import { BaseTextChunkNode } from './BaseTextChunkNode';
import { TextSpanNode } from '../TextSpanNode';
import { PlainTextSpanNode } from '../TextSpanNode/PlainTextSpanNode';
import { AnsiTextSpanNode } from '../TextSpanNode/AnsiTextSpanNode';
import { Derived } from '../miscInterfaces';

export const NewLineEscapeNodeKind: 'NewLineEscapeNode' = 'NewLineEscapeNode';
export type NewLineEscapeNodeKind = typeof NewLineEscapeNodeKind;

export class NewLineEscapeNode extends BaseTextChunkNode<NewLineEscapeNodeKind> implements Derived<NewLineEscapeNode> {
    public kind: NewLineEscapeNodeKind = NewLineEscapeNodeKind;
    public derivedFrom?: NewLineEscapeNode;
    public value: string;
    public width: 0 = 0;

    public clone(): NewLineEscapeNode;
    public clone(overrideParent: PlainTextSpanNode | AnsiTextSpanNode): NewLineEscapeNode;
    public clone(overrideParent?: PlainTextSpanNode | AnsiTextSpanNode): NewLineEscapeNode {
        const result = new NewLineEscapeNode(overrideParent || this.parent, this.value);
        result.derivedFrom = this;
        return result;
    }
}

