import * as _ from 'lodash';
import * as util  from 'util';

import { AnsiStyle } from '../Ansi/AnsiStyle';
import { RootNode, RootNodeKind } from './RootNode';
import { TextSpanNode, TextSpanNodeKind, TextSpanNodeLookup } from './TextSpanNode';
import { TextChunkNode, TextChunkNodeKind, TextChunkNodeLookup } from './TextChunkNode';

export type Node = (
    | RootNode
    | TextSpanNode
    | TextChunkNode
);

export type NodeKind = (
    | RootNodeKind
    | TextSpanNodeKind
    | TextChunkNodeKind
);

export interface NodeLookup extends TextChunkNodeLookup, TextSpanNodeLookup {
    [RootNodeKind]: RootNode;
}
