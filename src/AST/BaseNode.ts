import * as util from 'util';
import { Range } from './Range';
import { NodeKind } from '../AST';
import { PrettyPrint } from './miscInterfaces';

export abstract class BaseNode<T extends NodeKind> implements PrettyPrint {
    public abstract kind: T;
    public range: Range;
    public parent: BaseNode<NodeKind>;

    public constructor(parent: BaseNode<NodeKind>) {
        this.parent = parent;
    }

    public [util.inspect.custom](): string {
        return util.inspect(this.toJSON(), { colors: true, maxArrayLength: 256, depth: 8, customInspect: true });
    }

    public toJSON(): object {
        return {
            kind: this.kind,
            range: this.range
        };
    }
}

