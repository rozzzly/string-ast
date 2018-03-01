import { RootNode } from '../AST/RootNode';
import { wrapChildren, Children } from '../AST/navigation';
import { NewLineEscapeNode } from '../AST/TextChunkNode/NewLineEscapeNode';
import { CharacterNode } from '../AST/TextChunkNode/CharacterNode';
import { Location } from '../AST/Location';
import { Range } from '../AST/Range';
import { inRange } from '../misc';
import { TextChunkNode, PlainTextChunkNode } from '../AST/TextChunkNode';
import { AnsiTextSpanNode } from '../AST/TextSpanNode/AnsiTextSpanNode';
import { TextSpanNode } from '../AST/TextSpanNode';
import { PlainTextSpanNode } from '../AST/TextSpanNode/PlainTextSpanNode';

export type BadSliceStrategy = (
    | 'throw'
    | 'fill'
    | 'truncate'
);
export function sliceByPlainTextBytes(root: RootNode, start: number, stop?: number, strategy: BadSliceStrategy = 'throw'): RootNode {
    let start_safe: number;
    let stop_safe: number;
    const rc = root.children.createCursor();
    const rightBound = rc.last().range.stop.plainTextOffset;
    // allow negative indexes for `start`
    if (start < 0) {
        start_safe = rightBound - start;
    } else start_safe = start;
    // allow negative indexes for `end`
    if (stop < 0) {
        stop_safe = rightBound - stop;
    } else {
        if (stop === undefined) {
            stop_safe = rightBound;
        } else {
            stop_safe = stop;
        }
    }
    // ensure stop/start is valid
    if (!inRange(0, rightBound, start_safe)) throw new RangeError();
    if (!inRange(0, rightBound, stop_safe)) throw new RangeError();

    const nRoot = root.clone();
    let cursorOffset: number = 0;

    let currentSpan = rc.current;
    while (cursorOffset < stop_safe) {
        if (currentSpan.range.start.plainTextOffset >= start_safe) {
            // entire `TextSpanNode` is inside desired range, clone and save it.
            if (currentSpan.range.stop.plainTextOffset <= stop_safe) {
                nRoot.children.push(currentSpan.clone(nRoot));
                cursorOffset = currentSpan.range.stop.plainTextOffset;
            } else {
                // only some `TextChunkNode`s will be included. start collecting them..
                const included: PlainTextChunkNode[] = [];
                const chunks = (currentSpan.kind === 'AnsiTextSpanNode') ? currentSpan.plainTextChildren : currentSpan.children;
                const sc = chunks.createCursor();
                let currentChunk = sc.current;
                while (currentChunk.range.stop.plainTextOffset <= stop_safe) {
                    included.push(currentChunk);
                    cursorOffset = currentChunk.range.stop.plainTextOffset;
                    // advance to next chunk if there is one
                    if (sc.canAdvance()) currentChunk = sc.advance();
                    else break;
                }

                if (cursorOffset !== stop_safe) {
                    /// TODO ::: handle bad break
                }

                // construct text of the partial `TextSpanNode` from the included `TextChunkNode`s
                const text = included.reduce((reduction, chunk) => reduction + chunk.value, '');

                // create new `TextSpanNode`
                let nSpan: TextSpanNode = (currentSpan.kind === 'PlainTextSpanNode') ? (
                    new PlainTextSpanNode(nRoot, text, included)
                ) : (
                    new AnsiTextSpanNode(nRoot, text, currentSpan.style.clone(), [
                        // make sure any opening/closing `AnsiEscapeNode`s get copied over
                        ...currentSpan.relatedEscapes.before,
                        ...included,
                        ...currentSpan.relatedEscapes.after
                    ])
                );

                // append new `TextSpanNode`
                nRoot.children.push(nSpan);
            }
        } else {
            if (currentSpan.range.stop.plainTextOffset > start_safe) {
                // fontal partial
                
            } else {
                cursorOffset = currentSpan.range.stop.plainTextOffset;
            }
        }
        if (rc.canAdvance()) currentSpan = rc.advance();
        else break;
    }

    // rebuild ranges
    nRoot.calculateRange();

    return nRoot;
}