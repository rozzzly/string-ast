import { Implementation, scenario, Scenario, ExtractProposals, Proposal, SubmittedProposals } from '../Scenario';
import { RootNode } from '../AST/RootNode';
import { TextChunkNode } from '../AST/TextChunkNode/index';
import { widthOf } from '../width';

export interface BadSliceData {
    start: number;
    stop: number;
    gapWidth: number;
    partialSpan: TextChunkNode;
    partialChunk: TextChunkNode;
    originalRoot: RootNode;
}

export type BadSliceThrower = (data: BadSliceData) => never;

export class Throw {

    public thrower: BadSliceThrower;
    public name: 'Throw' = 'Throw';

    public constructor();
    public constructor(thrower: BadSliceThrower);
    public constructor(thrower: BadSliceThrower = Throw.defaultThrower) {
        this.thrower = thrower.bind(this);
    }

    public static defaultThrower(): never {
        throw new Error();
    }

}

export type BadSliceFiller = (
    | string
    | ((data: BadSliceData) => string)
);

export class Fill {
    public name: 'Fill' = 'Fill';
    protected filler: BadSliceFiller;
    public constructor();
    public constructor(filler: BadSliceFiller);
    public constructor(filler: BadSliceFiller = ' ') {
        if (typeof filler === 'string') {
            if (widthOf(filler) === 1) {
                this.filler = filler;
            } else {
                throw new Error('`BadSliceFiller`s which are strings must have a width of 1.');
            }
        } else {
            this.filler = filler;
        }
    }

    public fill(data: BadSliceData): string {
        if (typeof this.filler === 'string') {
            return this.filler.repeat(data.gapWidth);
        } else {
            const str = this.filler(data);
            if (widthOf(str) === data.gapWidth) {
                return str;
            } else {
                throw new Error('`BadSliceFiller`s must fill the gap.');
            }
        }
    }
}

export const badSlice = scenario([
    Throw,
    Fill
]);
