import { CompoundRange } from '../Range';
import { TextChunkNodeKind, TextChunkNode } from '../TextChunkNode';
import { BaseNode } from '../BaseNode';
import { TextSpanNode } from '../TextSpanNode';
import { SerializeStrategy, defaultSerializeStrategy, Derived } from '../miscInterfaces';

export abstract class BaseTextChunkNode<K extends TextChunkNodeKind> extends BaseNode<K> implements Derived<TextChunkNode> {
    public abstract kind: K;
    public abstract derivedFrom?: TextChunkNode;
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
    public abstract clone(parent: TextSpanNode): BaseTextChunkNode<K>;


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
