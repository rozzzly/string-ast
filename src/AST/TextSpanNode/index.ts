import * as _ from 'lodash';

import { RootNode } from '../RootNode';
import { PlainTextSpanNode, PlainTextSpanNodeKind } from './PlainTextSpanNode';
import { MemoizedData, HasRaw, Serializable, HasMemoizedData } from '../miscInterfaces';
import { AnsiTextSpanNode, AnsiTextSpanNodeKind } from './AnsiTextSpanNode';
import { splitText } from '../../splits';
import { BaseNode } from '../BaseNode';
import { Range, Location } from '../Range';


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