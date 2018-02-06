import { BaseTextChunkNode } from './BaseTextChunkNode';
import { AnsiTextSpanNode } from '../TextSpanNode/AnsiTextSpanNode';

export const AnsiEscapeNodeKind: 'AnsiEscapeNode' = 'AnsiEscapeNode';
export type AnsiEscapeNodeKind = typeof AnsiEscapeNodeKind;

export class AnsiEscapeNode extends BaseTextChunkNode<AnsiEscapeNodeKind> {
    public kind: AnsiEscapeNodeKind = AnsiEscapeNodeKind;
    public width: 0 = 0;
    public params: number[];
    public parent: AnsiTextSpanNode;

    public constructor(parent: AnsiTextSpanNode, params: number[]) {
        super(parent, `\u001b[${params.join(';')}m`);
        this.params = params;
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            params: this.params
        };
    }
}
