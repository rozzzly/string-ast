import { RootNode } from '../AST/RootNode';
import { previousNodeOfKind } from '../AST/navigation';
import { NewLineEscapeNode } from '../AST/TextChunkNode/NewLineEscapeNode';
import { CharacterNode } from '../AST/TextChunkNode/CharacterNode';
import { Location } from '../AST/Location';
import { Range } from '../AST/Range';
import { inRange } from '../misc';
import { TextChunkNode } from '../AST/TextChunkNode';

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
    // ensure stop/start is valid
    if (!inRange(0, rightBound, start_safe)) throw new RangeError();
    if (!inRange(0, rightBound, end_safe)) throw new RangeError();

    const nRoot = root.clone();
    const cursor: { span: number, chunk: number, offset: number } = { span: 0, chunk: 0, offset: 0 };

    while (cursor.offset < end_safe) {
        if (cursor.span >= root.children.length) throw new RangeError();
        else {
            const currentSpan = root.children.get(cursor.span);
            if (cursor.offset >= currentSpan.range.start.plainTextOffset) {
                // entire span is inside desired range, clone and save it.
                if (cursor.offset <= currentSpan.range.stop.plainTextOffset) {
                    nRoot.children.push(currentSpan.clone(nRoot));
                    cursor.offset = currentSpan.range.stop.plainTextOffset;
                    cursor.span++;
                } else {
                    const included: TextChunkNode[] = [];
                    const chunks = currentSpan.children;
                    let currentChunk = chunks.get(0);
                    while (cursor.offset < currentChunk.range.stop.plainTextOffset) {
                        included.push(currentChunk);
                    }
                }
            }
        }



    }

    return root;
}