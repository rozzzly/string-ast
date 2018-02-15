import { Range } from './Range';
import { NodeKind, Node } from '../AST';
import { Serializable, HasChildren, SerializeStrategy, defaultSerializeStrategy } from './miscInterfaces';
import { Children, wrapChildren } from './navigation';
import * as _  from 'lodash';
import { Memorizer } from './Memoizer';


export abstract class BaseNode<K extends NodeKind> implements Serializable {
    public abstract kind: K;
    public range: Range;

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

export abstract class ComputedNode<K extends NodeKind> extends BaseNode<K> {
    protected memoized: Memorizer<{}, this>;

    public constructor() {
        super();
        this.memoized = new Memorizer(this);
    }

    public invalidate(): void {
        this.memoized.invalidate();
    }
}