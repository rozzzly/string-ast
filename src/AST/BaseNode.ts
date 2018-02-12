import { Range } from './Range';
import { NodeKind, Node } from '../AST';
import { Serializable, HasChildren, SerializeStrategy } from './miscInterfaces';
import { Children, wrapChildren } from './navigation';
import * as _  from 'lodash';
import { Memorizer } from './Memorizer';


export abstract class BaseNode<K extends NodeKind> implements Serializable {
    public abstract kind: K;
    public range: Range;

    public toJSON(): object;
    public toJSON(strategy: SerializeStrategy): object;
    public toJSON(strategy: SerializeStrategy = 'Data_Extended'): object {
        const display = (strategy === 'Display' || strategy === 'Display_Extended');
        return {
            kind: this.kind,
            range: display ? this.range.toString() : this.range.toJSON()
        };
    }
}

export abstract class ComputedNode<K extends NodeKind, D extends {}> extends BaseNode<K> {
    protected memoized: Memorizer<D>;

    public constructor() {
        super();
        this.memoized = new Memorizer();
    }

    public invalidate() {
        this.memoized.invalidate();
    }
}