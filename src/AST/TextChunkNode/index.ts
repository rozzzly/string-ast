import { CharacterNode, CharacterNodeKind } from './CharacterNode';
import { AnsiEscapeNode, AnsiEscapeNodeKind } from './AnsiEscapeNode';
import { NewLineEscapeNode, NewLineEscapeNodeKind } from './NewLineEscapeNode';

export type TextChunkNode = (
    | CharacterNode
    | AnsiEscapeNode
    | NewLineEscapeNode
);

export type TextChunkNodeKind = (
    | CharacterNodeKind
    | AnsiEscapeNodeKind
    | NewLineEscapeNodeKind
);

export interface TextChunkNodeLookup {
    [CharacterNodeKind]: CharacterNode;
    [AnsiEscapeNodeKind]: AnsiEscapeNode;
    [NewLineEscapeNodeKind]: NewLineEscapeNode;
}