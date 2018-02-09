import { BaseTextChunkNode } from './BaseTextChunkNode';
import { TextSpanNode } from '../TextSpanNode';

export const NewLineEscapeNodeKind: 'NewLineEscapeNode' = 'NewLineEscapeNode';
export type NewLineEscapeNodeKind = typeof NewLineEscapeNodeKind;

export class NewLineEscapeNode extends BaseTextChunkNode<NewLineEscapeNodeKind> {
    public kind: NewLineEscapeNodeKind = NewLineEscapeNodeKind;
    public value: string;
    public width: 0 = 0;
}

