import { RootNode } from '../AST/RootNode';
import { previousNodeOfKind, wrapChildren, Children } from '../AST/navigation';
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
    const rightBound = root.children.get(-1).range.stop.plainTextOffset;
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
    const cursor: { span: number, chunk: number, offset: number } = { span: 0, chunk: 0, offset: 0 };

    while (cursor.offset < stop_safe) {
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
                    const included: Children<TextChunkNode> = wrapChildren([]);
                    const chunks = (currentSpan.kind === 'AnsiTextSpanNode') ? currentSpan.plainTextChildren : currentSpan.children;
                    let currentChunk = chunks.get(cursor.chunk);
                    while (cursor.offset < currentChunk.range.stop.plainTextOffset) {
                        included.push(currentChunk);
                        cursor.offset += currentChunk.bytes;
                        // advance to next chunk if there is one
                        if (cursor.chunk < chunks.length) {
                            currentChunk = chunks.get(++cursor.chunk);
                        }
                    }

                    if (cursor.offset < stop_safe) {
                        /// TODO ::: handle bad break
                    }

                    // if current span is a `AnsiTextSpanNode` --> make sure any closing `AnsiEscapeNode`s get copied over
                    if (currentSpan.kind === 'AnsiTextSpanNode') {
                        included.unshift(...currentSpan.relatedEscapes.before);
                        included.push(...currentSpan.relatedEscapes.after);
                    }

                    // create new `TextSpanNode`
                    const text = included.reduce((reduction, chunk) => (chunk.kind === 'AnsiEscapeNode') ? reduction : reduction + chunk.value, '');
                    let nSpan: TextSpanNode = (currentSpan.kind === 'PlainTextSpanNode') ? (
                        new PlainTextSpanNode(nRoot, text, included as Children<PlainTextChunkNode>)
                    ) : (
                        new AnsiTextSpanNode(nRoot, text, currentSpan.style.clone(), included)
                    );

                    // append new `TextSpanNode`
                    nRoot.children.push(nSpan);
                }
            }
            cursor.span++;
        }

    }

    // rebuild ranges
    nRoot.calculateRange();

    return root;
}