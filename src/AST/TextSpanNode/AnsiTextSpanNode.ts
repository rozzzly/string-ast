import { RootNode } from '../RootNode';
import { AnsiStyle } from '../../Ansi/AnsiStyle';
import { BaseTextSpanNode, TextSpanMemoizedData } from './BaseTextSpanNode';
import { AnsiEscapeNode } from '../TextChunkNode/AnsiEscapeNode';
import { MemoizedData } from '../miscInterfaces';
import { PlainTextChunkNode } from '../TextChunkNode';
import { Children, wrapChildren } from '../navigation';


export const AnsiTextSpanNodeKind: 'AnsiTextSpanNode' = 'AnsiTextSpanNode';
export type AnsiTextSpanNodeKind = typeof AnsiTextSpanNodeKind;

export interface RelatedAnsiEscapes {
    before: AnsiEscapeNode[];
    after: AnsiEscapeNode[];
}
export interface AnsiTextSpanMemoizedData extends TextSpanMemoizedData {
    raw: string;
    relatedEscapes: RelatedAnsiEscapes;
    plainTextChildren: Children<PlainTextChunkNode>;
}

export class AnsiTextSpanNode extends BaseTextSpanNode<AnsiTextSpanNodeKind, AnsiTextSpanMemoizedData> {
    public kind: AnsiTextSpanNodeKind = AnsiTextSpanNodeKind;
    public style: AnsiStyle;
    public [MemoizedData]: AnsiTextSpanMemoizedData;

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
        this[MemoizedData] = { ...this[MemoizedData], raw: undefined };
    }

    /// TODO ::: proxyify `this.children` to recompute `raw`
    /// when new children are appended

    // public get raw(): string {
    //     let result = '';
    //     this.children.forEach(child => {
    //         if (child.type === 'AnsiEscapeNode') {
    //             result += child.value;
    //         }
    //         result += child.value
    //     });
    //     return result;
    // }

    public updateMemoizedData(): void {
        super.updateMemoizedData();
        let raw: string = '';
        let plainTextChildren: Children<PlainTextChunkNode> = wrapChildren([]);
        const before: AnsiEscapeNode[] = [];
        const after: AnsiEscapeNode[] = [];
        let textReached: boolean = false;
        this.children.forEach(child => {
            raw += child.value;
            if (child.kind === 'AnsiEscapeNode') {
                if (!textReached) before.push(child);
                else after.push(child);
            } else {
                plainTextChildren.push(child);
                textReached = true;
            }
        });
        this.setMemoizedData('raw', raw);
        this.setMemoizedData('relatedEscapes', { before, after });
        this.setMemoizedData('plainTextChildren', plainTextChildren);
    }

    public get relatedEscapes(): RelatedAnsiEscapes  {
        if (!this.isMemoizedDataCurrent('relatedEscapes')) this.updateMemoizedData();

        return this.getMemoizedData('relatedEscapes');
    }

    public get raw(): string {
        if (!this.isMemoizedDataCurrent('raw')) this.updateMemoizedData();

        return this.getMemoizedData('raw');
    }

    public get plainTextChildren(): PlainTextChunkNode[]  {
        if (!this.isMemoizedDataCurrent('plainTextChildren')) this.updateMemoizedData();

        return this.getMemoizedData('plainTextChildren');
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            style: this.style,
            relatedEscapes: this.relatedEscapes,
        };
    }
}