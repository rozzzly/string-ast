import { BaseTextChunkNode } from './BaseTextChunkNode';
import { AnsiTextSpanNode } from '../TextSpanNode/AnsiTextSpanNode';
import { SerializeStrategy, defaultSerializeStrategy, minVerbosity } from '../miscInterfaces';

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
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        const result: any =  {
            ...super.toJSON(strat),
        };

        if (strat.verbosity === 'full') {
            if (strat.mode === 'display') {
                result.params = this.params.join(' ');
            } else {
                result.params = this.params;
            }
        }

        if (strat.mode === 'display') {
            result.value = `\\u001b[${this.params.join(';')}m`;
        }

        return result;
    }
}
