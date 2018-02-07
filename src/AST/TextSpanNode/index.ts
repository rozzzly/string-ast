import { PlainTextSpanNode, PlainTextSpanNodeKind } from './PlainTextSpanNode';
import { AnsiTextSpanNode, AnsiTextSpanNodeKind } from './AnsiTextSpanNode';


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