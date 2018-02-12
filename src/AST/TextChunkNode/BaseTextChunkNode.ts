import { CompoundRange } from '../Range';
import { TextChunkNodeKind } from '../TextChunkNode';
import { BaseNode } from '../BaseNode';
import { TextSpanNode } from '../TextSpanNode';
import { SerializeStrategy } from '../miscInterfaces';

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

    public toJSON(): object;
    public toJSON(strategy: SerializeStrategy): object;
    public toJSON(strategy: SerializeStrategy = 'Data_Extended'): object {
        return {
            ...super.toJSON(strategy),
            bytes: this.bytes,
            width: this.width,
            value: this.value
        };
    }
}
