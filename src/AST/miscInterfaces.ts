import { BaseNode } from './BaseNode';
import { Children } from './navigation';
import { Node } from '../AST';

export type SerializeStrategy = (
    | 'Data'
    | 'Data_Extended'
    | 'Display'
    | 'Display_Extended'
);

export interface Serializable {
    toJSON(): object;
    toJSON(strategy: SerializeStrategy): object;
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