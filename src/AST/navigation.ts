import { NodeKind, Node, NodeLookup } from '../AST';
import { inRange } from '../misc';

export const IsChildren: unique symbol = Symbol('[string-ast]::AST/navigation.Children');
export type IsInvalidated = typeof IsChildren;


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