import { NodeKind, Node, NodeLookup, KindUnion } from '../AST';
import { inRange } from '../misc';
import { Range } from './Range';
import { TextSpanNode } from './TextSpanNode';

export class GenericCursor<E> {
    protected _position: number;
    protected ref: E[];

    public constructor(value: E[]) {
        this.ref = value;
        this._position = 0;
    }

    public get isEmpty(): boolean { return this.ref.length === 0; }

    public first<T extends E = E>(): T {
        if (this.isEmpty) throw new RangeError();
        else {
            return this.ref[0] as T;
        }
    }
    public last<T extends E = E>(): T {
        if (this.isEmpty) throw new RangeError();
        else {
            return this.ref[this.ref.length - 1] as T;
        }
    }

    public get position(): number { return this._position; }
    public set position(value: number) {
        if (inRange(0, this.ref.length - 1, value)) {
            // using normal index like on an array where `0` is the first element and `this.length - 1` is the last element
            this._position = value;
        } else if (inRange(0 - this.ref.length, -1, value)) {
            // using negative indexes like `Array.prototype.slice()` where an index of -1 is the last element, -2 the second last, and so on
            this._position = this.ref.length - Math.abs(value);
        } else throw new RangeError();
    }

    public get length(): number {
         return this.ref.length;
    }

    public get current(): E {
        return this.ref[this._position];
    }
    /**
     * Allows me to do this:
     * ```typescript
     * type Foo = { iAmAFoo: true };
     * type Bar = { iAmAFoo: true, iAmAlsoABar: true };
     * const foo: Foo = undefined;
     * const bar: Bar = undefined;
     * const nc = new GenericCursor([ foo, bar ]);
     * const noCastFailImplicit = nc.current; // infers as Foo (because its a subtype of `Foo | Bar`)
     * noCastFailImplicit.iAmAlsoABar; // ERROR `iAmAlsoABar` does not exist on type `Foo`
     * const noCastFailExplicit: Bar = nc.current; // ERROR type `Foo` (because its a subtype of `Foo | Bar`) is not assignable to type `Bar`
     * console.log(noCastFailExplicit.iAmAlsoABar); // PASS because its explictly a Bar, but we still got an error in the declaration
     * const castFailImplicit = nc.currentCast(); // infers as `Foo` (because its a subtype of `Foo | Bar`)
     * console.log(castFailImplicit.iAmAlsoABar); // ERROR `iAmAlsoABar` does not exist on type `Foo`
     * const castPassImplicit: Bar = nc.currentCast(); // PASS!
     * console.log(castPassImplicit.iAmAlsoABar); // PASS!
     * ```
     * @template T extends E
     * @returns T cast version of E
     */
    public currentCast<T extends E = E>(): T {
        return this.ref[this._position] as T;
    }


    public reset(): E {
        this._position = 0;
        return this.ref[0];
    }

    public seek<T extends E = E>(delta: number): T {
        const nPos = this._position + delta;
        if (inRange(0, this.ref.length - 1, nPos)) {
            this._position = nPos;
            return this.ref[this._position] as T;
        } else throw new RangeError();
    }

    public canAdvance(): boolean {
        return this._position < (this.ref.length - 1);
    }

    public canReverse(): boolean {
        return this._position > 0;
    }

    public advance<T extends E = E>(): T | never;
    public advance<T extends E = E>(safe: boolean): T | null;
    public advance<T extends E = E>(safe: boolean = false): T | null | never {
        if (this.canAdvance()) {
            return this.ref[++this._position] as T ;
        } else {
            if (safe) return null;
            else throw new RangeError();
        }
    }

    public reverse<T extends E = E>(): T | never;
    public reverse<T extends E = E>(safe: boolean): T | null;
    public reverse<T extends E = E>(safe: boolean = false): T | null | never {
        if (this.canReverse()) {
            return this.ref[--this._position] as T;
        } else {
            if (safe) return null;
            else throw new RangeError();
        }
    }

    public seekNPeek<T extends E = E>(delta: number): T {
        const nPos = this._position + delta;
        if (inRange(0, this.ref.length - 1, nPos)) {
            return this.ref[nPos] as T;
        } else throw new RangeError();
    }

    public peekAt<T extends E = E>(index: number): T {
        if (inRange(0, this.ref.length - 1, index)) {
            return this.ref[index] as T;
        } else if (inRange(0 - this.ref.length, -1, index)) {
            return this.ref[this.ref.length - Math.abs(index)] as T;
        } else throw new RangeError();
    }

    public peekNext<T extends E = E>(): T {
        if (this.canAdvance()) {
            return this.ref[this._position + 1] as T;
        } else {
            throw new RangeError();
        }
    }

    public peekPrev<T extends E = E>(): T {
        if (this.canReverse()) {
            return this.ref[this._position - 1] as T;
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
            return kindsSafe.includes(this.first().kind as K);
        } else throw new RangeError();
    }


    public isLastNodeOfKind<K extends KindUnion<N>>(kinds: K): boolean;
    public isLastNodeOfKind<K extends KindUnion<N>>(kinds: K[]): boolean;
    public isLastNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): boolean {
        if (!this.isEmpty) {
            const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
            return kindsSafe.includes(this.last().kind as K);
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
    public isNodeOfKind<K extends KindUnion<N>>(kinds: K | K[], position: number = this.position): boolean {
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

    public advanceUntilNodeOfKind<K extends KindUnion<N>>(kind: K): Node<K> | undefined;
    public advanceUntilNodeOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K> | undefined;
    public advanceUntilNodeOfKind<K extends KindUnion<N>>(kinds: K | K[]): Node<K> | undefined {
        const kindsSafe = Array.isArray(kinds) ? kinds : [ kinds ];
        while (this.canAdvance()) {
            if (kindsSafe.includes(this.advance().kind as K)) return this.current;
        }
        return undefined;
    }

    public reverseUntilNodeOfKind<K extends KindUnion<N>>(kind: K): Node<K> | undefined;
    public reverseUntilNodeOfKind<K extends KindUnion<N>>(kinds: K[]): Node<K> | undefined;
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

/**
 * Methods on `Array.prototype` which mutate the array, as per MDN
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Mutator_methods
 */
const mutates: (keyof Array<any>)[] = [
    'copyWithin',
    'fill',
    'pop',
    'push',
    'reverse',
    'shift',
    'sort',
    'splice',
    'unshift',
];

/// TODO ::: add override that allows user to supply invalidation callback
///     - a `Proxy`ified array is returned
///     - set via index lookup syntax (eg `ary[3] = false`) will trigger invalidation
///     - calls to methods which mutate will trigger invalidation
///     - mutation of properties of array items WILL NOT trigger invalidation
///         ```typescript
///             const bestFriend = { name: 'Steve' };
///             const friends = wrapChildren([ bestFriend, ...otherFriends ]);
///             friends[0].name = 'Kevin'; // will not trigger invalidation
///             friends[0] = { name: 'Ryan' }; // will trigger invalidation
///         ```
export function wrapChildren<K extends Node>(): Children<K>;
export function wrapChildren<K extends Node>(children: K[]): Children<K>;
export function wrapChildren<K extends Node>(children: K[], invalidate: () => void): Children<K>;
export function wrapChildren<K extends Node>(children: K[] = [], invalidate?: () => void): Children<K> {
    // prevent mutations
    const items: Children<K> = [...children] as any;

    if (invalidate) {
        const proxy = new Proxy(items, {
            get(target, prop: keyof Children<K>, receiver) {
                if (prop === 'createCursor') {
                    return (): NodeCursor<K> => new NodeCursor(proxy);
                } else  {
                    if (mutates.includes(prop)) invalidate();
                    return Reflect.get(target, prop, receiver);
                }
            },
            set(target, prop: keyof Children<K>, value, receiver): any {
                invalidate();
                return Reflect.set(target, prop, value, receiver);
             }
        });
        return proxy;
    } else {
        Object.defineProperty(items, 'createCursor', {
            enumerable: false,
            value: (): NodeCursor<K> => new NodeCursor(items)
        });
        return items;
    }

}

