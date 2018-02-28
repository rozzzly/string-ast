import * as _ from 'lodash';
import * as util  from 'util';

import { RootNode, RootNodeKind } from './RootNode';
import { TextSpanNode, TextSpanNodeKind, TextSpanNodeLookup } from './TextSpanNode';
import { TextChunkNode, TextChunkNodeKind, TextChunkNodeLookup } from './TextChunkNode';


export type NodeKind = (
    | RootNodeKind
    | TextSpanNodeKind
    | TextChunkNodeKind
);

export type KindUnion<N extends Node = Node> = N['kind'];

export interface NodeLookup extends TextChunkNodeLookup, TextSpanNodeLookup {
    [RootNodeKind]: RootNode;
}

export type Node<K extends NodeKind = NodeKind> = NodeLookup[K];