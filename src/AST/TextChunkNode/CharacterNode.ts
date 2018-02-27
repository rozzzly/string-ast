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
    public clone(overrideParent: TextSpanNode): CharacterNode;
    public clone(overrideParent?: TextSpanNode): CharacterNode {
        const result =  new CharacterNode(overrideParent || this.parent, this.value);
        result.derivedFrom = this;
        return result;
    }
}

