import { widthOf } from '../../width';
import { TextSpanNode } from '../TextSpanNode';
import { BaseTextChunkNode } from './BaseTextChunkNode';
import { Derived } from '../miscInterfaces';

export const CharacterNodeKind: 'CharacterNode' = 'CharacterNode';
export type CharacterNodeKind = typeof CharacterNodeKind;

export class CharacterNode extends BaseTextChunkNode<CharacterNodeKind> implements Derived<CharacterNode> {
    public kind: CharacterNodeKind = CharacterNodeKind;
    public derivedFrom?: CharacterNode;
    public width: number;

    public constructor(parent: TextSpanNode, value: string) {
        super(parent, value);
        this.width = widthOf(value);
    }

    public clone(): CharacterNode;
    public clone(parent: TextSpanNode): CharacterNode;
    public clone(parent: TextSpanNode = this.parent): CharacterNode {
        const result =  new CharacterNode(parent, this.value);
        result.derivedFrom = this;
        return result;
    }
}

