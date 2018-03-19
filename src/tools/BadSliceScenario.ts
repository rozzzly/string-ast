import { Implementation, scenario, Scenario, ExtractProposals, Proposal, SubmittedProposals } from '../Scenario';
import { RootNode } from '../AST/RootNode';
import { TextChunkNode, TextChunkNodeKind, PlainTextChunkNode } from '../AST/TextChunkNode/index';
import { widthOf, plainTextLengthOf } from '../width';
import { ChildInRange, PartialNode, PartialNodeType } from './slice';
import { TextSpanNode } from '../AST/TextSpanNode/index';
import { CharacterNode } from '../AST/TextChunkNode/CharacterNode';

export interface BadChunkSliceData {
    start: number;
    stop: number;
    gapLeft: number;
    gapRight: number;
    partialType: PartialNodeType;
    slicedBy: 'plainTextOffset' | 'width';
    originalSpan: TextSpanNode;
    originalChunk: PlainTextChunkNode;
    originalRoot: RootNode;
}

export type BadSliceThrower = (data: BadChunkSliceData) => never;

export class Throw {

    public thrower: BadSliceThrower;
    public name: 'Throw' = 'Throw';

    public constructor();
    public constructor(thrower: BadSliceThrower);
    public constructor(thrower: BadSliceThrower = Throw.defaultThrower) {
        this.thrower = thrower.bind(this);
    }

    public static defaultThrower(data: BadChunkSliceData): never {
        console.error(data);
        throw new Error('bad slice');
    }

}


export type BadSliceFiller = (
    | string
    | ((data: BadChunkSliceData, parent: TextSpanNode) => TextChunkNode)
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

    public fill(slice: BadChunkSliceData, parent: TextSpanNode): TextChunkNode {
        const desiredSize = ((slice.slicedBy === 'plainTextOffset')
            ? slice.originalChunk.bytes - slice.gapLeft - slice.gapRight
            : slice.originalChunk.width - slice.gapLeft - slice.gapRight
        );
        // const nChunkKind  = ((slice.originalChunk.kind === 'CharacterNode')
        //     ? CharacterNode
        //     : ((slice.originalChunk.kind === 'NewLineEscapeNode')
        //         ? CharacterNode // if we are filling a NewLineEscapeNode, just replace it with a `CharacterNode`
        //         : undefined // throw error so we know to add support for new `TextChunkNodeKind`s
        //     )
        // );
        /// TODO :: test if it contains any AnsiEscapes (not just if it is an AnsiEscapesNode)
        /// TODO :: create new AnsiTextSpanNode inject it into the RootNode
        if (typeof this.filler === 'string') {
            return slice.originalChunk.clone(parent, this.filler.repeat(desiredSize));
        } else {
            const fill = this.filler(slice, parent);
            // test function depends on what we are slicing by
            const test: (str: string) => number = (slice.slicedBy === 'width') ? widthOf : plainTextLengthOf;
            // rest of the logic is the same
            if (
                slice.slicedBy === 'width' && fill.width === desiredSize
                || slice.slicedBy === 'plainTextOffset' && fill.bytes === desiredSize
             ) {
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
