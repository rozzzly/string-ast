import { BaseTextChunkNode } from './BaseTextChunkNode';
import { AnsiTextSpanNode } from '../TextSpanNode/AnsiTextSpanNode';
import { SerializeStrategy } from '../miscInterfaces';

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

    public toJSON(): object;
    public toJSON(strategy: SerializeStrategy): object;
    public toJSON(strategy: SerializeStrategy = 'Data_Extended'): object {
        const result: any =  {
            ...super.toJSON(strategy),
        };

        if (strategy === 'Data_Extended') {
            result.params = this.params;
        } else if (strategy === 'Display_Extended') {
            result.params = this.params.join(' ');
        }

        return result;
    }
}
