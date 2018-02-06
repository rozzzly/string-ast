import { RootNode } from '../RootNode';
import { AnsiStyle } from '../../Ansi/AnsiStyle';
import { BaseTextSpanNode, TextSpanMemoizedData } from './BaseTextSpanNode';
import { AnsiEscapeNode } from '../TextChunkNode/AnsiEscapeNode';
import { MemoizedData, Serializable } from '../miscInterfaces';


export const AnsiTextSpanNodeKind: 'AnsiTextSpanNode' = 'AnsiTextSpanNode';
export type AnsiTextSpanNodeKind = typeof AnsiTextSpanNodeKind;

export interface AnsiTextSpanMemoizedData extends TextSpanMemoizedData {
    raw: string;
}

export class AnsiTextSpanNode extends BaseTextSpanNode<AnsiTextSpanNodeKind, AnsiTextSpanMemoizedData> implements Serializable {
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

    public get raw(): string {
        if (this.isMemoizedDataCurrent('raw')) return this.getMemoizedData('raw');
        else {
            this.setMemoizedData('raw', this.children.reduce((reduction, child) => reduction + child.value, ''));
            return this.getMemoizedData('raw');
        }
    }
    public updateMemoizedData(): void {
        this.setMemoizedData('raw', this.raw);
        this.updateMemoizedData();
    }

    public get relatedEscapes(): { before: AnsiEscapeNode[], after: AnsiEscapeNode[] }  {
        const before: AnsiEscapeNode[] = [];
        const after: AnsiEscapeNode[] = [];
        let textReached: boolean = false;
        this.children.forEach(child => {
            if (child.kind === 'AnsiEscapeNode') {
                if (textReached) after.push(child);
                else before.push(child);
            } else {
                textReached = true;
            }
        });
        return { before, after };
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            style: this.style,
            relatedEscapes: this.relatedEscapes,
        };
    }
}