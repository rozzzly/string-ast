import { Implementation, scenario, Scenario, ExtractProposals, Proposal, SubmittedProposals } from '../Scenario';
import { RootNode } from '../AST/RootNode';
import { TextChunkNode, TextChunkNodeKind } from '../AST/TextChunkNode/index';
import { widthOf, plainTextLengthOf } from '../width';
import { ChildInRange } from './slice';

export interface BadSliceData {
    start: number;
    stop: number;
    gapLeft: number;
    gapRight: number;
    slicedBy: 'plainTextOffset' | 'width';
    partialSpan: ChildInRange<TextChunkNode>;
    partialChunk: ChildInRange<TextChunkNode>;
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

export interface BadSliceFill {
    left?: string;
    right?: string;
}

export type BadSliceFiller = (
    | string
    | ((data: BadSliceData) => BadSliceFill)
);


export class Fill {
    public static defaultFiller: BadSliceFiller = ' ';
    public name: 'Fill' = 'Fill';
    protected filler: BadSliceFiller;
    public constructor();
    public constructor(filler: BadSliceFiller);
    public constructor(filler: BadSliceFiller = Fill.defaultFiller) {
        if (typeof filler === 'string') {
            if (widthOf(filler) === 1 && plainTextLengthOf(filler) === 1) {
                this.filler = filler;
            } else {
                throw new Error('`BadSliceFiller`s which are strings must have a length and a width of 1.');
            }
        } else {
            this.filler = filler;
        }
    }

    public fill(slice: BadSliceData): BadSliceFill {
        if (typeof this.filler === 'string') {
            return {
                left: this.filler.repeat(slice.gapLeft),
                right: this.filler.repeat(slice.gapRight)
            };
        } else {
            const fill = this.filler(slice);
            // test function depends on what we are slicing by
            const test: (str: string) => number = (slice.slicedBy === 'width') ? widthOf : plainTextLengthOf;
            // rest of the logic is the same
            const leftOk = !slice.gapLeft && !fill.left || test(fill.left) === slice.gapLeft;
            const rightOk = !slice.gapRight && !fill.right || test(fill.right) === slice.gapRight;
            if (leftOk && rightOk) {
                return fill;
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
