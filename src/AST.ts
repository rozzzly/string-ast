export interface Location {
    offset: number;
    line: number;
    column: number;
}

export interface Range {
    start: Location;
    stop: Location;
}

export interface Node<T extends string = NodeTypes> {
    type: T;
    loc: Range;
    parent: Node;
    raw: string;
}



export type Nodes = (
    | RootNode
    | PlainTextNode
    | AnsiTextNode
    | CharacterNode
    | NewLineNode
    | AnsiEscapeNode
);

export type NodeTypes = (
    | 'RootNode'
    // | 'TextNode'
    | 'PlainTextNode'
    | 'AnsiTextNode'
    | 'CharacterNode'
    | 'NewLineNode'
    | 'AnsiEscapeNode'
);

export type NodeTypeLookup = {
    
    TextNode: (
        | 'PlainTextNode'
        | 'AnsiTextNode'
    );
    CharacterNode: (
        | 'CharacterNode'
        | 'NewLineNode'
        | 'AnsiEscapeNode'
    );
    // NewLineNode: NodeLineNode;
};


export class BaseNode<T extends NodeTypes> implements Node<T> {
    public type: T;
    public loc: Range;
    public relativeLoc: Range;
    public parent: Node;
    public raw: string;
    public constructor(parent: Node) {
        this.parent = parent;
    }
}

export type TextNode = (
    | PlainTextNode
    | AnsiTextNode
);

export type TextNodeTypes = (
    | 'PlainTextNode'
    | 'AnsiTextNode'
);

export class RootNode extends BaseNode<'RootNode'> {
    public children: TextNode[];
    public derivedFrom?: RootNode;
    public constructor() {
        super(undefined);
    }
    public splitMultiLine(): this {
        if (this.derivedFrom) {
            throw new ReferenceError();
        } else {
            return undefined;
        }
    }
}

export abstract class BaseTextNode<T extends TextNodeTypes> extends BaseNode<T> {
    public parent: RootNode;
    public children: VisibleCharacterNode[];
    public derivedFrom?: this;
    public constructor(parent: RootNode, children: VisibleCharacterNode[]) {
        super(parent);
        this.children = children;
    }

    public get lines(): CharacterNode[][] {
        const result: CharacterNode[][] = [];
        for(let i = 0, l = 0; i < this.children.length; i++) {
            const current = this.children[i];
            if (current.type === 'NewLineNode') {
                l++;
            } else {
                result[l].push(current);
            }
        }
        return result;
    }
    public abstract splitMultiLine(): this[];
}

export class PlainTextNode extends BaseTextNode<'PlainTextNode'> { 

    public splitMultiLine(): this[] {
        throw new Error("Method not implemented.");
    }
}

export class AnsiTextNode extends BaseTextNode<'AnsiTextNode'> {
    public splitMultiLine(): this[] {
        throw new Error("Method not implemented.");
    }
    public open: AnsiEscapeNode;
    public close: AnsiEscapeNode;
}

export type CharacterNodeTypes = (
    | 'CharacterNode'
    | 'NewLineNode'
    | 'AnsiEscapeNode'
);

export type VisibleCharacterNode = (
    | CharacterNode
    | NewLineNode
);

export type VisibleCharacterNodeTypes = (
    | 'CharacterNode'
    | 'NewLineNode'
);
export class CharacterNode<T extends CharacterNodeTypes = 'CharacterNode'> extends BaseNode<T> {
    public value: string;

    public constructor(parent: TextNode, value: string) {
        super(parent);
        this.value = value;
    }
}

export class NewLineNode extends CharacterNode<'NewLineNode'> {

}
export class AnsiEscapeNode extends CharacterNode<'AnsiEscapeNode'> {

}