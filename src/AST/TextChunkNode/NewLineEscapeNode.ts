import { BaseTextChunkNode } from './BaseTextChunkNode';
import { TextSpanNode } from '../TextSpanNode';
import { PlainTextSpanNode } from '../TextSpanNode/PlainTextSpanNode';
import { AnsiTextSpanNode } from '../TextSpanNode/AnsiTextSpanNode';
import { Derived } from '../miscInterfaces';

export const newLineRegex: RegExp = /(\u000A|(?:\r?\n))/u;

export const NewLineEscapeNodeKind: 'NewLineEscapeNode' = 'NewLineEscapeNode';
export type NewLineEscapeNodeKind = typeof NewLineEscapeNodeKind;

export class NewLineEscapeNode extends BaseTextChunkNode<NewLineEscapeNodeKind> implements Derived<NewLineEscapeNode> {
    public kind: NewLineEscapeNodeKind = NewLineEscapeNodeKind;
    public derivedFrom?: NewLineEscapeNode;
    public value: string;
    public width: 0 = 0;

    public constructor(parent: TextSpanNode, value: string) {
        super(parent, value);
        if (!newLineRegex.test(value)) {
            throw new TypeError('This is not a valid NewLineEscapeNode value.');
        }
    }

    public clone(): NewLineEscapeNode;
    public clone(parent: TextSpanNode): NewLineEscapeNode;
    public clone(parent: TextSpanNode, value: string): NewLineEscapeNode;
    public clone(parent: TextSpanNode = this.parent, value: string = this.value): NewLineEscapeNode {
        const result = new NewLineEscapeNode(parent, this.value);
        result.derivedFrom = this;
        return result;
    }
}

