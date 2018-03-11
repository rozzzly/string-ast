import { scenario, Scenario } from '../Scenario';
import { RootNode } from '../AST/RootNode';
import { TextChunkNode } from '../AST/TextChunkNode/index';

export interface SliceData {
    start: number;
    stop: number;
    partialSpan: TextChunkNode;
    partialChunk: TextChunkNode;
    originalRoot: RootNode;
}

export type BadSliceThrower = (data: SliceData) => never;

export class Throw {
    public thrower: BadSliceThrower;

    public constructor();
    public constructor(thrower: BadSliceThrower);
    public constructor(thrower: BadSliceThrower = Throw.prototype.defaultThrower) {
        this.thrower = thrower.bind(this);
    }

    private defaultThrower(): never {
        throw new Error();
    }
}

export const badSlice = scenario('BadSlice', {
    Throw
});