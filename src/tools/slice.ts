import { RootNode } from '../AST/RootNode';
import { wrapChildren, Children } from '../AST/navigation';
import { NewLineEscapeNode } from '../AST/TextChunkNode/NewLineEscapeNode';
import { CharacterNode } from '../AST/TextChunkNode/CharacterNode';
import { Location } from '../AST/Location';
import { Range } from '../AST/Range';
import { inRange } from '../misc';
import { TextChunkNode, PlainTextChunkNode } from '../AST/TextChunkNode';
import { AnsiTextSpanNode } from '../AST/TextSpanNode/AnsiTextSpanNode';
import { TextSpanNode, TextSpanNodeKind } from '../AST/TextSpanNode';
import { PlainTextSpanNode } from '../AST/TextSpanNode/PlainTextSpanNode';
import { Node } from '../AST/index';
import { Implementation } from '../Scenario';
import { badSlice, Throw, BadSliceData } from './BadSliceScenario';
import { BaseTextSpanNode } from '../AST/TextSpanNode/BaseTextSpanNode';

export type BadSliceStrategy = 'throw' | 'fill' | 'omit';

export type Gap = (
    | { left: number; }
    | { right: number; }
    | { left: number; right: number; }
);
export type ChildInRange<K extends Node> = (
    | { node: K; type: 'full' }
    | { node: K; gap: Gap; type: 'leftPartial' | 'rightPartial' | 'doublePartial' }
);
export type ChildrenInRange<K extends Node> = ChildInRange<K>[];

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
    do {
        const nodeStart = getStart(current.range);
        const nodeStop = getStop(current.range);

        // --------A--------B--------
        // --X--Y--|--------|-------- none (break)
        // --X-----Y--------|-------- none (break)
        // --X-----|--Y-----|-------- rightPartial (break)
        // --X-----|--------Y-------- full (break)
        // --X-----|--------|--Y----- full (next will be a rightPartial)
        // --------X--Y-----|-------- rightPartial (break)
        // --------X--------Y-------- full (break)
        // --------X--------|--Y----- full (next child will be a rightPartial)
        // --------|--X--Y--|-------- doublePartial (break)
        // --------|--X-----Y-------- leftPartial (break)
        // --------|--X-----|--Y----- leftPartial (next will be a rightPartial)
        // --------|--------X--Y----- none (advance)
        // --------|--------|--X--Y-- none (advance)

        if (leftBound < nodeStart) {
            if (rightBound > nodeStart) {
                if (rightBound < nodeStop) {
                    // --------A--------B--------
                    // --X-----|--Y-----|-------- rightPartial (break)
                    result.push({
                        node: current,
                        type: 'rightPartial',
                        gap: {
                            right: nodeStop - rightBound
                        }
                    });
                } else {
                    // --------A--------B--------
                    // --X-----|--------Y-------- full (break)
                    // --X-----|--------|--Y----- full (next will be a rightPartial)
                    result.push({ node: current, type: 'full' });
                    if (rightBound === nodeStop) break;
                }
            } else {
                // --------A--------B--------
                // --X--Y--|--------|-------- none (break)
                // --X-----Y--------|-------- none (break)
                break;
            }
        } else if (leftBound === nodeStart) {
            if (rightBound < nodeStop) {
                // --------A--------B--------
                // --------X--Y-----|-------- rightPartial (break)
                result.push({
                    node: current,
                    type: 'rightPartial',
                    gap: {
                        right: nodeStop - rightBound
                    }
                });
                break;
            } else {
                // --------A--------B--------
                // --------X--------Y-------- full (break)
                // --------X--------|--Y----- full (next will be a rightPartial)
                result.push({ node: current, type: 'full' });
                if (rightBound === nodeStop) break;
                else continue;
            }
        } else { // leftBound > nodeStart
            if (leftBound < nodeStop) {
                if (rightBound < nodeStop) {
                    // --------A--------B--------
                    // --------|--X--Y--|-------- doublePartial (break)
                    result.push({
                        node: current,
                        type: 'doublePartial', gap: {
                            left: leftBound - nodeStart,
                            right: nodeStop - rightBound
                        }
                    });
                    break;
                } else {
                    // --------A--------B--------
                    // --------|--X-----|--Y----- leftPartial (next will be a rightPartial)
                    // --------|--X-----Y-------- leftPartial (break)
                    result.push({
                        node: current,
                        type: 'leftPartial',
                        gap: {
                            left: leftBound - nodeStart
                        }
                    });
                    if (rightBound === nodeStop) break;
                    else continue;
                }
            } else {
                // --------A--------B--------
                // --------|--------X--Y----- none (break)
                // --------|--------|--X--Y-- none (break)
                continue;
            }
        }
    } while ((current = nc.advance(true)) !== null);

    return result;
}

export function sliceByPlainTextOffset(
    root: RootNode,
    start: number,
    stop?: number
): RootNode;
export function sliceByPlainTextOffset(
    root: RootNode,
    start: number,
    stop: number,
    strategy: Implementation<typeof badSlice>
): RootNode;
export function sliceByPlainTextOffset(
    root: RootNode,
    start: number,
    stop?: number,
    strategy: Implementation<typeof badSlice> = 'Throw'
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
    spans.forEach(({ type: spanType, node: span }) => {
        if (spanType === 'full') {
            nRoot.children.push(span.clone(nRoot));
        } else {
            const included: PlainTextChunkNode[] = [];
            const chunks = getChildrenInRange((
                (span.kind === 'AnsiTextSpanNode'
                    ? span.plainTextChildren
                    : span.children
                )
            ), start_safe, stop_safe);
            const includesPartial = chunks.reduce((reduction, chunk) => (
                reduction || chunk.type !== 'full'
            ), false);

            if (includesPartial) {

                const nSpan  = (span as BaseTextSpanNode<TextSpanNodeKind>).clone(nRoot, []);
                chunks.forEach(({ type: chunkType, node: chunk }) => {
                    if (chunkType === 'full') {
                        nSpan.children.push(chunk.clone(nSpan as any));
                    } else {
                        const data: BadSliceData = {
                            partialChunk: { type: spanType, node: chunk},
                            partialSpan: { type: chunkType, node: span},
                            originalRoot: root,
                            start: start_safe,
                            stop: stop_safe,
                            gapLeft: span.range.start.plainTextOffset - start_safe,
                            gapRight: span.range.stop.plainTextOffset - stop_safe,
                            slicedBy: 'plainTextOffset'
                        }
                        const stratImpl = badSlice.enact(strategy);
                        if (stratImpl.name === 'Throw') {
                            stratImpl.thrower(data);
                        } else {
                            const fill = stratImpl.fill(data);
                            nSpan.children.push();
                        }
                    }
                });
                if (nSpan.kind === 'AnsiTextSpanNode')  {
                    const escapeClones = (nSpan as AnsiTextSpanNode).relatedEscapes.clone(nSpan as AnsiTextSpanNode);
                    nSpan.children.unshift(...escapeClones.before);
                    nSpan.children.push(...escapeClones.after);
                }
            } else {
                const nSpan  = (span as BaseTextSpanNode<TextSpanNodeKind>).clone(nRoot, []);
                chunks.forEach(({ type: chunkType, node: chunk }) => {
                    nSpan.children.push(chunk.clone(nSpan as any));
                });
                if (nSpan.kind === 'AnsiTextSpanNode')  {
                    const escapeClones = (nSpan as AnsiTextSpanNode).relatedEscapes.clone(nSpan as AnsiTextSpanNode);
                    nSpan.children.unshift(...escapeClones.before);
                    nSpan.children.push(...escapeClones.after);
                }
            }
        }
    });

    // rebuild ranges
    nRoot.calculateRange();

    // reset text on `RootNode`
    nRoot.raw = nRoot.children.reduce((reduction, child) => reduction + child.raw, '');
    nRoot.normalized = nRoot.children.reduce((reduction, child) => reduction + child.text, '');

    return nRoot;
}
