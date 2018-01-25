export interface Location {
    offset: number;
    line: number;
    column: number;
}

export interface Range {
    start: Location;
    stop: Location;
}

export interface Node<T in NodeTypes = NodeTypes> {
    type: T;
    loc: Range;
    parent: Node;
    raw: string;
}

export type Nodes = (
    | RootNode
    | TextNode
    | PlainTextNode
    | AnsiTextNode
    | CharacterNode
    | NewLineNode
    | AnsiEscapeNode
);

export type NodeTypes = (
    | 'RootNode'
    | 'TextNode'
    | 'PlainTextNode'
    | 'AnsiTextNode'
    | 'CharacterNode'
    | 'NewLineNode'
    | 'AnsiEscapeNode'
);

export type NodeLookup<T in NodeTypes> = {
    
    TextNode: (
        | 'PlainTextNode'
        | 'AnsiTextNode'
    );
    CharacterNode: (
        | 'CharacterNode'
        | 'NewLineNode'
        | 'AnsiEscapeNode'
    );
    ''
};


export class BaseNode<T in NodeTypes = NodeTypes> implements Node<T> {
    public type: T;
    public loc: Range;
    public parent: Node
}

export class 