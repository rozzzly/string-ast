import { NodeKind, Node, NodeLookup } from '../AST';

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

export function lastNode <K extends Node>(children: Node[]): K {
    return children.length ? children[children.length - 1] as K : undefined;
}

export function isLastNodeOfKind(children: Node[], kind: NodeKind): boolean {
    return children.length && children[children.length - 1].kind === kind;
}