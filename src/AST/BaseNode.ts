import { Range } from './Range';
import { NodeKind, Node } from '../AST';
import { PrettyPrint, HasChildren } from './miscInterfaces';
import { Children, wrapChildren } from './navigation';
import * as _  from 'lodash';
import { Memorizer } from './Memorizer';


export abstract class BaseNode<K extends NodeKind> implements PrettyPrint {
    public abstract kind: K;
    public range: Range;

    public toJSON(): object {
        return {
            kind: this.kind,
            range: this.range
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