import { BaseNode } from './BaseNode';
import { Children } from './navigation';
import { Node } from '../AST';
import { atLeast } from '../misc';

export type Verbosity = (
    | 'minimal'
    | 'extended'
    | 'full'
);

export const minVerbosity = atLeast<Verbosity>([
    'minimal',
    'extended',
    'full'
]);

export const maxVerbosity = atLeast<Verbosity>([
    'minimal',
    'extended',
    'full'
]);

export interface SerializeStrategy {
    mode: (
        | 'data'
        | 'display'
    );
    verbosity: Verbosity;
}

export const defaultSerializeStrategy: SerializeStrategy = {
    mode: 'data',
    verbosity: 'extended'
};

export interface Serializable {
    toJSON(): object;
    toJSON(strategy: Partial<SerializeStrategy>): object;
}

export interface HasRaw {
    raw: string;
}

export interface HasNormalized {
    normalized: string;
}

export interface Derived<K extends Node> {
    derivedFrom?: K;
}