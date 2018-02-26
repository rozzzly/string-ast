import { RootNode } from '../AST/RootNode';
import { previousNodeOfKind } from '../AST/navigation';
import { NewLineEscapeNode } from '../AST/TextChunkNode/NewLineEscapeNode';
import { CharacterNode } from '../AST/TextChunkNode/CharacterNode';
import { Location } from '../AST/Location';

export type BadSliceStrategy = (
    | 'throw'
    | 'fill'
    | 'truncate'
);
export function sliceByPlainTextBytes(root: RootNode, start: number, end?: number, strategy: BadSliceStrategy = 'throw'): RootNode {
    let start_safe: number;
    let end_safe: number;
    const rightBound = root.children.get(-1).range.stop.plainTextOffset;
    // allow negative indexes for `start`
    if (start < 0) {
        start_safe = rightBound - start;
    } else start_safe = start;
    // allow negative indexes for `end`
    if (end < 0) {
        end_safe = rightBound - end;
    } else {
        if (end === undefined) {
            end_safe = rightBound;
        } else {
            end_safe = end;
        }
    }

    let startSpan;



    return root;
}