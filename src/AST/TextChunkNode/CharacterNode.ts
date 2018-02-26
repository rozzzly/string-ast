import { widthOf } from '../../width';
import { TextSpanNode } from '../TextSpanNode';
import { BaseTextChunkNode } from './BaseTextChunkNode';

export const CharacterNodeKind: 'CharacterNode' = 'CharacterNode';
export type CharacterNodeKind = typeof CharacterNodeKind;

export class CharacterNode extends BaseTextChunkNode<CharacterNodeKind> {
    public kind: CharacterNodeKind = CharacterNodeKind;
    public width: number;

    public constructor(parent: TextSpanNode, value: string) {
        super(parent, value);
        this.width = widthOf(value);
    }

    public clone(): CharacterNode;
    public clone(overrideParent: TextSpanNode): CharacterNode;
    public clone(overrideParent?: TextSpanNode): CharacterNode {
        return new CharacterNode(overrideParent || this.parent, this.value);
    }
}

