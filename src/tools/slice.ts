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
import { Node } from '../AST/index';

export type BadSliceStrategy = 'throw' | 'fill' | 'omit';


type ChildrenInRange<K extends Node> = { node: K; type: 'full' | 'backPartial' | 'rightPartial' | 'doublePartial' }[];

function getChildrenInRange<K extends Node>(
    children: Children<K>,
    /** @param {number} leftBound inclusive left bound */
    leftBound: number,
    /** @param {number} rightBound exclusive left bound */
    rightBound: number,
    getStart: (range: Range) => number = (range: Range) => range.start.plainTextOffset,
    getStop: (range: Range) => number = (range: Range) => range.stop.plainTextOffset
):  ChildrenInRange<K> {
    const result: ChildrenInRange<K> = [];

    const nc = children.createCursor();
    let current = nc.current;
    while (true) {
        const nodeStart = getStart(current.range);
        const nodeStop = getStop(current.range);

        // --------A--------B--------
        // --X--Y--|--------|-------- none (advance)
        // --X-----Y--------|-------- none (advance)
        // --X-----|--Y-----|-------- rightPartial
        // --X-----|--------Y-------- full
        // --X-----|--------|--Y----- full
        // --------X--Y-----|-------- rightPartial
        // --------X--------Y-------- full
        // --------X--------|--Y----- full
        // --------|--X--Y--|-------- doublePartial
        // --------|--X-----Y-------- backPartial
        // --------|--X-----|--Y----- backPartial
        // --------|--------X--Y----- none (break)
        // --------|--------|--X--Y-- none (break)

        if (leftBound < nodeStart) {
            if (rightBound > nodeStart) {
                if (rightBound < nodeStop) {
                    // --------A--------B--------
                    // --X-----|--Y-----|-------- rightPartial
                    result.push({ node: current, type: 'rightPartial' });
                } else {
                    // --------A--------B--------
                    // --X-----|--------Y-------- full
                    // --X-----|--------|--Y----- full
                    result.push({ node: current, type: 'full' });
                }
            } else {
                // --------A--------B--------
                // --X--Y--|--------|-------- none (advance)
                // --X-----Y--------|-------- none (advance)
                if (nc.canAdvance()) current = nc.advance();
                else break;
            }
        } else if (leftBound === nodeStart) {
            if (rightBound < nodeStop) {
                // --------A--------B--------
                // --------X--Y-----|-------- rightPartial
                result.push({ node: current, type: 'rightPartial' });
            } else {
                // --------A--------B--------
                // --------X--------Y-------- full
                // --------X--------|--Y----- full
                result.push({ node: current, type: 'full' });
            }
        } else {
            if (leftBound < nodeStop) {
                if (rightBound < nodeStop) {
                    // --------A--------B--------
                    // --------|--X--Y--|-------- doublePartial
                    result.push({ node: current, type: 'doublePartial' });
                } else {
                    // --------A--------B--------
                    // --------|--X-----|--Y----- backPartial
                    // --------|--X-----Y-------- backPartial
                    result.push({ node: current, type: 'backPartial' });
                }
            } else {
                // --------A--------B--------
                // --------|--------X--Y----- none (break)
                // --------|--------|--X--Y-- none (break)
                break;
            }
        }
    }

    return result;
}

export function sliceByPlainTextOffset(
    root: RootNode,
    start: number,
    stop?: number,
    strategy: BadSliceStrategy = 'throw'
): RootNode {
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
    if (start_safe < stop_safe) throw new RangeError();

    const nRoot = root.clone([]);
    let cursorOffset: number = 0;

    const spans = getChildrenInRange(root.children, start_safe, stop_safe);
    spans.forEach(span => {
        if (span.type === 'full') {
            nRoot.children.push(span.node.clone(nRoot));
        } else {
            const included: PlainTextChunkNode[] = [];
            const chunks = getChildrenInRange((
                (currentSpan.kind === 'AnsiTextSpanNode'
                    ? currentSpan.plainTextChildren
                    : currentSpan.children
                )
            ), start_safe, stop_safe);
            const includesPartial = chunks.reduce((reduction, chunk) => (
                reduction || chunk.type !== 'full'
            ), false);

            if (includesPartial) {
                /// TODO ::: Handle strategy
            }
            const nSpan = new

        }
    });
    //
    //
    // ------|------------------|------------------------------
    // ----------|=======|-------------------------------------
    // ----------|===================|-------------------------
    // -----|================|---------------------------------
    // --|========================================|------------
    //

    let currentSpan = rc.current;
    while (cursorOffset < stop_safe) {
        const csrStart = currentSpan.range.start.plainTextOffset;
        const csrStop = currentSpan.range.stop.plainTextOffset;
        // entire `TextSpanNode` is inside desired range, clone and save it.
        if (csrStart >= start_safe && csrStop <= stop_safe) {
            nRoot.children.push(currentSpan.clone(nRoot));
            cursorOffset = currentSpan.range.stop.plainTextOffset;
        } else if (csrStart > start_safe || csrStop < stop_safe) {
            // determine from which end of the `TextSpanNode` things will be truncated.
            const backPartial: boolean = csrStart > start_safe;
            const rightPartial: boolean = csrStop < stop_safe;
                        // only some `TextChunkNode`s will be included. start collecting them..
            const included: PlainTextChunkNode[] = [];
            const chunks = ((currentSpan.kind === 'AnsiTextSpanNode')
                ? currentSpan.plainTextChildren
                : currentSpan.children
            );
            const sc = chunks.createCursor();
            let currentChunk = sc.current;
            while (cursorOffset < stop_safe) {
                const startInRange = currentChunk.range.start.plainTextOffset >= start_safe;
                const stopInRange = currentChunk.range.stop.plainTextOffset <= stop_safe;
                if (startInRange && stopInRange) {
                    included.push(currentChunk);
                } else if (startInRange || stopInRange) {
                    if (strategy === 'throw') {
                        throw new RangeError(); /// TODO ::: this really needs a better error message
                    } else if (strategy === 'fill') {
                        // const gap = ((partialDirection === 'back')
                        //     ? currentChunk.range.stop.plainTextOffset - cursorOffset
                        //     : currentChunk.range.start.plainTextOffset - cursorOffset
                        // );
                        // included.push(new CharacterNode(undefined, ' '.repeat(gap)));
                    } else if (strategy === 'omit') {
                        // noop();
                    } else {
                        throw new TypeError();
                    }
                }
                cursorOffset = currentChunk.range.stop.plainTextOffset;
                // advance to next chunk if there is one
                if (sc.canAdvance()) currentChunk = sc.advance();
                else break;
            }

            // construct text of the partial `TextSpanNode` from the included `TextChunkNode`s
            const text = included.reduce((reduction, chunk) => reduction + chunk.value, '');

            // create new `TextSpanNode`
            let nSpan: TextSpanNode = ((currentSpan.kind === 'PlainTextSpanNode')
                ? new PlainTextSpanNode(nRoot, text, included)
                : new AnsiTextSpanNode(nRoot, text, currentSpan.style.clone(), [
                    // make sure any opening/closing `AnsiEscapeNode`s get copied over
                    ...currentSpan.relatedEscapes.before,
                    ...included,
                    ...currentSpan.relatedEscapes.after
                ])
            );

            // append new `TextSpanNode`
            nRoot.children.push(nSpan);
        } else {
            cursorOffset = currentSpan.range.stop.plainTextOffset;
        }
        if (rc.canAdvance()) currentSpan = rc.advance();
        else break;
    }

    // rebuild ranges
    nRoot.calculateRange();

    // reset text on `RootNode`
    const raw = nRoot.children.reduce((reduction, child) => reduction + child.text, '');
    nRoot.raw = raw;
    nRoot.normalized = raw;

    return nRoot;
}
