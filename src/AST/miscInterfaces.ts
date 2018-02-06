import { BaseNode } from './BaseNode';

export interface Serializable {
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

export const MemoizedData: unique symbol = Symbol('[string-ast]::Node(HasMemoizedData).MemoizedData');
export type MemoizedData = typeof MemoizedData;

export interface HasMemoizedData<D extends {}> {
    [MemoizedData]: D;
    isMemoizedDataCurrent(): boolean;
    isMemoizedDataCurrent<K extends keyof D = keyof D>(key: K): boolean;
    getMemoizedData<K extends keyof D = keyof D>(key: K): D[K];
    setMemoizedData<K extends keyof D = keyof D>(key: K, value: D[K]): void;
    updateMemoizedData(): void;
}

export interface Derived<T extends BaseNode<any>> {
    derivedFrom?: T;
}