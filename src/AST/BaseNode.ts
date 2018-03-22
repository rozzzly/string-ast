import * as _  from 'lodash';
import { Range } from './Range';
import { NodeKind, Node } from '../AST';
import { Serializable, SerializeStrategy, defaultSerializeStrategy, Derived } from './miscInterfaces';
import { Children, wrapChildren } from './navigation';
import { Memoizer, DataMap, ComputerMap } from './Memoizer';


export abstract class BaseNode<K extends NodeKind> implements Serializable, Derived<Node> {
    public abstract kind: K;
    public abstract derivedFrom?: Node;
    public range: Range;

    public abstract clone(): BaseNode<K>;

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };
        return {
            kind: this.kind,
            range: strat.mode === 'display' ? this.range.toString() : this.range.toJSON()
        };
    }
}

export abstract class ComputedNode<K extends NodeKind, D extends {}> extends BaseNode<K> {
    protected memoized: Memoizer<D, this>;

    protected static get computers(): ComputerMap<{}, typeof ComputedNode> {
        return {};
    }

    public constructor() {
        super();
        this.memoized = new Memoizer(this, (this.constructor as any).computers);
    }

    public abstract clone(): BaseNode<K>;

    public invalidate(): void {
        this.memoized.invalidate();
    }
}