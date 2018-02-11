import { BaseNode } from './BaseNode';
import { Children } from './navigation';
import { Node } from '../AST';

export interface PrettyPrint {
    toJSON(): object;
    toJSON(key: string): object;
    toJSON(key?: string): object;
}

export interface HasRaw {
    raw: string;
}

export interface HasNormalized {
    normalized: string;
}

export const IsInvalidated: unique symbol = Symbol('[string-ast]::Node(Invalidatable)');
export type IsInvalidated = typeof IsInvalidated;

export type Invalidatable<T> = (
    | T
    | IsInvalidated
);

export interface Derived<T extends BaseNode<any>> {
    derivedFrom?: T;
}

export interface HasChildren<T extends Node> {
    children: Children<T>;
}