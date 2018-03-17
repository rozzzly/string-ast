import { PlainTextSpanNode, PlainTextSpanNodeKind } from './PlainTextSpanNode';
import { AnsiTextSpanNode, AnsiTextSpanNodeKind } from './AnsiTextSpanNode';
import { PlainTextChunkNode, TextChunkNode } from '../TextChunkNode/index';

export type TextSpanNode = (
    | PlainTextSpanNode
    | AnsiTextSpanNode
);

export type TextSpanNodeKind = (
    | PlainTextSpanNodeKind
    | AnsiTextSpanNodeKind
);

export interface TextSpanNodeLookup {
    [PlainTextSpanNodeKind]: PlainTextSpanNode;
    [AnsiTextSpanNodeKind]: AnsiTextSpanNode;
}
