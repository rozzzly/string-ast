import { NodeKind, Node, NodeLookup, KindUnion } from '../AST';
import { inRange } from '../misc';
import { Range } from './Range';
import { TextSpanNode } from './TextSpanNode';

export class GenericCursor<E> {
    protected _position: number;
    protected ref: E[];

    public constructor(value: E[]) {
        this.ref = value;
        this.position = 0;
    }

    public get isEmpty(): boolean { return this.ref.length === 0; }

    public get first(): E {
        if (this.isEmpty) throw new RangeError();
        else {
            return this.ref[0];
        }
    }
    public get last(): E {
        if (this.isEmpty) throw new RangeError();
        else {
            return this.ref[this.ref.length - 1];
        }
    }

    public get position(): number { return this._position; }
    public set position(value: number) {
        if (inRange(0, this.ref.length - 1, value)) {
            this._position = value;
        } else if (inRange(0 - this.ref.length, -1, value)) {
            this._position = this.ref.length - Math.abs(value);
        } else throw new RangeError();
    }

    public get length(): number {
         return this.ref.length;
    }

    public get current(): E {
        return this.ref[this._position];
    }


    public reset(): E {
        this._position = 0;
        return this.ref[0];
    }

    public seek(delta: number): E {
        const nPos = this._position + delta;
        if (inRange(0, this.ref.length - 1, nPos)) {
            this._position = nPos;
            return this.ref[this._position];
        } else throw new RangeError();
    }

    public canAdvance(): boolean {
        return this._position < (this.ref.length - 1);
    }

    public canReverse(): boolean {
        return this._position > 0;
    }

    public advance(): E {
        if (this.canAdvance()) {
            return this.ref[++this._position];
        } else {
            throw new RangeError();
        }
    }

    public reverse(): E {
        if (this.canReverse()) {
            return this.ref[--this._position];
        } else {
            throw new RangeError();
        }
    }

    public seekNPeek(delta: number): E {
        const nPos = this._position + delta;
        if (inRange(0, this.ref.length - 1, nPos)) {
            return this.ref[nPos];
        } else throw new RangeError();
    }

    public peekAt(index: number): E {
        if (inRange(0, this.ref.length - 1, index)) {
            return this.ref[index];
        } else if (inRange(0 - this.ref.length, -1, index)) {
            return this.ref[this.ref.length - Math.abs(index)];
        } else throw new RangeError();
    }

    public peekNext(): E {
        if (this.canAdvance()) {
            return this.ref[this._position + 1];
        } else {
            throw new RangeError();
        }
    }

    public peekPrev(): E {
        if (this.canAdvance()) {
            return this.ref[this._position - 1];
        } else {
            throw new RangeError();
        }
    }

}

export class NodeCursor<N extends Node = Node> extends GenericCursor<N> {
    public nodesOfKindInRange<K extends KindUnion<N>>(kinds: K, start: number, end: number): Node<K>[];
    public nodesOfKindInRange<K extends KindUnion<N>>(kinds: K[], start: number, end: number): Node<K>[];
    public nodesOfKindInRange<K extends KindUnion<N>>(kinds: K, start: number, end: number, count: number): Node<K>[];
    public nodesOfKindInRange<K extends KindUnion<N>>(kinds: K[], start: number, end: number, count: number): Node<K>[];
    public nodesOfKindInRange<K extends KindUnion<N>>(kinds: K | K[], start: number, end: number, count: number = Infinity): Node<K>[] {
        if (!inRange(0, this.ref.length - 1, start)) throw new RangeError();
        else {
            const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
            const result: Node<K>[] = [];
            for (let i = start; i <= end && result.length < count; i++) {
                if (kindsSafe.includes(this.ref[i].kind as K)) result.push(this.ref[i]);
            }
            return result;
        }
    }

    public hasNodesOfKindInRange<K extends KindUnion<N>>(kinds: K, start: number, end: number): boolean;
    public hasNodesOfKindInRange<K extends KindUnion<N>>(kinds: K[], start: number, end: number): boolean;
    public hasNodesOfKindInRange<K extends KindUnion<N>>(kinds: K | K[], start: number, end: number): boolean {
        return this.nodesOfKindInRange(kinds as K, start, end).length !== 0;
    }

    public isFirstNodeOfKind<K extends KindUnion<N>>(kinds: K): boolean;
    public isFirstNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public isFirstNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        if (!this.isEmpty) {
            const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
            return kindsSafe.includes(this.first.kind as K);
        } else throw new RangeError();
    }


    public isLastNodeOfKind<K extends KindUnion<N>>(kinds: K): boolean;
    public isLastNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public isLastNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        if (!this.isEmpty) {
            const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
            return kindsSafe.includes(this.last.kind as K);
        } else throw new RangeError();
    }


    public lastNodeOfKind<K extends KindUnion<N>>(kinds: K): Node<K>;
    public lastNodeOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K>;
    public lastNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        for (let i = this.ref.length - 1; i >= 0; i++) {
            if (kindsSafe.includes(this.ref[i].kind as K)) return this.ref[i];
        }
    }

    public firstNodeOfKind<K extends KindUnion<N>>(kinds: K): Node<K>;
    public firstNodeOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K>;
    public firstNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        for (let i = 0; i < this.ref.length; i++) {
            if (kindsSafe.includes(this.ref[i].kind as K)) return this.ref[i];
        }
    }

    public futureNodesOfKind<K extends KindUnion<N>>(kinds: K): Node<K>[];
    public futureNodesOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K>[];
    public futureNodesOfKind<K extends KindUnion<N>>(kinds: K, count: number): Node<K>[];
    public futureNodesOfKind<K extends KindUnion<N>>(kinds: K[], count: number): Node<K>[];
    public futureNodesOfKind<K extends KindUnion<N>>(kinds: K | K[], count: number = Infinity): Node<K>[] {
        if (!this.canAdvance()) throw new RangeError();
        return this.nodesOfKindInRange(kinds as K, this.position + 1, this.ref.length - 1, count);
    }

    public pastNodesOfKind<K extends KindUnion<N>>(kinds: K): Node<K>[];
    public pastNodesOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K>[];
    public pastNodesOfKind<K extends KindUnion<N>>(kinds: K, count: number): Node<K>[];
    public pastNodesOfKind<K extends KindUnion<N>>(kinds: K[], count: number): Node<K>[];
    public pastNodesOfKind<K extends KindUnion<N>>(kinds: K | K[], count: number = Infinity): Node<K>[] {
        if (!this.canReverse()) throw new RangeError();
        return this.nodesOfKindInRange(kinds as K, this.position + 1, this.ref.length - 1, count);
    }

    public nextNodeOfKind<K extends KindUnion<N>>(kinds: K): Node<K>;
    public nextNodeOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K>;
    public nextNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> | undefined {
        const result = this.futureNodesOfKind(kinds as K, 1);
        return result.length !== 0 ? result[0] : undefined;
    }

    public previousNodeOfKind<K extends KindUnion<N>>(kinds: K): Node<K>;
    public previousNodeOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K>;
    public previousNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> | undefined {
        const result = this.pastNodesOfKind(kinds as K, 1);
        return result.length !== 0 ? result[0] : undefined;
    }

    public hasNodeOfKind<K extends KindUnion<N>>(kind: K): boolean;
    public hasNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public hasNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        return this.ref.some(v => kindsSafe.includes(v.kind as K));
    }

    public isNodeOfKind<K extends KindUnion<N>>(kind: K): boolean;
    public isNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public isNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        return kindsSafe.includes(this.ref[this._position].kind as K);
    }

    public isNextNodeOfKind<K extends KindUnion<N>>(kinds: K): boolean;
    public isNextNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public isNextNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        if (!this.canAdvance()) throw RangeError();
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        return kindsSafe.includes(this.ref[this.position + 1] as any);
    }

    public isPreviousNodeOfKind<K extends KindUnion<N>>(kinds: K): boolean;
    public isPreviousNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public isPreviousNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        if (!this.canReverse()) throw RangeError();
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        return kindsSafe.includes(this.ref[this.position - 1] as any);
    }

    public advanceUntilNodeOfKind<K extends KindUnion<N>>(kind: K): boolean;
    public advanceUntilNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public advanceUntilNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> | undefined {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        while (this.canAdvance()) {
            if (kindsSafe.includes(this.advance().kind as K)) return this.current;
        }
        return undefined;
    }

    public reverseUntilNodeOfKind<K extends KindUnion<N>>(kind: K): boolean;
    public reverseUntilNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public reverseUntilNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> | undefined {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        while (this.canReverse()) {
            if (kindsSafe.includes(this.reverse().kind as K)) return this.current;
        }
        return undefined;
    }
}
export interface Children<K extends Node> extends Array<K> {
    createCursor(): NodeCursor<K>;
}

export function wrapChildren<K extends Node>(): Children<K>;
export function wrapChildren<K extends Node>(children: K[]): Children<K>;
export function wrapChildren<K extends Node>(children: K[] = []): Children<K> {
    // prevent mutations
    const result: Children<K> = [...children] as any;

    Object.defineProperty(result, 'createCursor', {
        enumerable: false,
        value: (): NodeCursor<K> => new NodeCursor(result)
    });

    return result;
}
