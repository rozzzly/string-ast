import { CompoundRange } from '../Range';
import { TextChunkNodeKind } from '../TextChunkNode';
import { BaseNode } from '../BaseNode';
import { TextSpanNode } from '../TextSpanNode';
import { SerializeStrategy, defaultSerializeStrategy } from '../miscInterfaces';

export abstract class BaseTextChunkNode<K extends TextChunkNodeKind> extends BaseNode<K> {
    public abstract kind: K;
    public abstract width: number;
    public value: string;
    public bytes: number;
    public range: CompoundRange;
    public parent: TextSpanNode;

    public constructor(parent: TextSpanNode, value: string) {
        super();
        this.parent = parent;
        this.value = value;
        this.bytes = value.length;
    }

    public abstract clone(): BaseTextChunkNode<K>;
    public abstract clone(overrideParent: TextSpanNode): BaseTextChunkNode<K>;


    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        return {
            ...super.toJSON(strat),
            bytes: this.bytes,
            width: this.width,
            value: this.value
        };
    }
}
