import { NodeKind, Node, NodeLookup } from '../AST';
import { inRange } from '../misc';
import { Range } from './Range';

export const IsChildren: unique symbol = Symbol('[string-ast]::AST/navigation.Children');
export type IsInvalidated = typeof IsChildren;

class Cursor<N extends Node> {
    private _position: number;
    private ref: N[];

    public constructor(value: N[]) {
        this.ref = value;
        this.position = 0;
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

    public get current(): N {
        return this.ref[this._position];
    }

    public seek(delta: number): N {
        const nPos = this._position + delta;
        if (inRange(0, this.ref.length - 1, nPos)) {
            this._position = nPos;
            return this.ref[this._position];
        } else throw new RangeError();
    }

    public hasNext(): boolean {
        return this._position < (this.ref.length - 1);
    }
    public hasPrev(): boolean {
        return this._position > 0;
    }
    public next(): N {
        if (this.hasNext) {
            return this.ref[++this._position];
        } else {
            throw new RangeError();
        }
    }
    public prev(): N {
        if (this.hasNext) {
            return this.ref[--this._position];
        } else {
            throw new RangeError();
        }
    }
    public seekNPeek(delta: number): N {
        const nPos = this._position + delta;
        if (inRange(0, this.ref.length - 1, nPos)) {
            return this.ref[nPos];
        } else throw new RangeError();
    }
    public peekAt(index: number): N {
        if (inRange(0, this.ref.length - 1, index)) {
            return this.ref[index];
        } else if (inRange(0 - this.ref.length, -1, index)) {
            return this.ref[this.ref.length - Math.abs(index)];
        } else throw new RangeError();
    }
    public peekNext(): N {
        if (this.hasNext) {
            return this.ref[this._position + 1];
        } else {
            throw new RangeError();
        }
    }
    public peekPrev(): N {
        if (this.hasNext) {
            return this.ref[this._position - 1];
        } else {
            throw new RangeError();
        }
    }

}


export interface Children<U> extends Array<U> {
    get<T extends U = U>(index: number): T;
    [IsChildren]: true;
}

export function wrapChildren<U>(): Children<U>;
export function wrapChildren<U>(children: U[]): Children<U>;
export function wrapChildren<U>(children: U[] = []): Children<U> {
    // prevent double wrapping
    if ((children as any)[IsChildren]) return children as any;

    // prevent mutations
    const result: Children<U> = [...children] as any;

    Object.defineProperty(result, IsChildren, {
        enumerable: false,
        value: true
    });
    Object.defineProperty(result, 'get', {
        enumerable: false,
        value: <T extends U>(index: number): T => {
            if (inRange(0, result.length - 1, index)) {
                return result[index] as T;
            } if (inRange(0 - result.length, -1, index)) {
                return result[result.length - Math.abs(index)] as T;
            } else {
                throw new RangeError(); /// TODO ::: more descriptive errors
            }
        }
    });

    return result;
}

export function previousNodeOfKind<K extends NodeKind>(children: Node[], kind: K): NodeLookup[K] {
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].kind === kind) return children[i];
    }
    return undefined;
}

export function hasPreviousNodeOfKind(children: Node[], kind: NodeKind): boolean {
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].kind === kind) return true;
    }
    return false;
}

export function isLastNodeOfKind(children: Node[], kind: NodeKind): boolean {
    return children.length && children[children.length - 1].kind === kind;
}