import { RootNode } from '../RootNode';
import { AnsiStyle } from '../../Ansi/AnsiStyle';
import { BaseTextSpanNode, TextSpanMemoizedData } from './BaseTextSpanNode';
import { AnsiEscapeNode } from '../TextChunkNode/AnsiEscapeNode';
import { IsInvalidated, SerializeStrategy } from '../miscInterfaces';
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

    public constructor(parent: RootNode, text: string, style: AnsiStyle) {
        super(parent, text);
        this.style = style;
        this.memoized.computers.raw = () => this.children.reduce((reduction, child) => reduction + child.value, '');
        this.memoized.computers.plainTextChildren = () => {
            const plainTextChildren: Children<PlainTextChunkNode> = wrapChildren([]);
            this.children.forEach(child => {
                if (child.kind !== 'AnsiEscapeNode') {
                    plainTextChildren.push(child);
                }
            });
            return plainTextChildren;
        };
        this.memoized.computers.relatedEscapes = () => {
            const before: AnsiEscapeNode[] = [];
            const after: AnsiEscapeNode[] = [];
            let textReached: boolean = false;
            this.children.forEach(child => {
                if (child.kind === 'AnsiEscapeNode') {
                    if (!textReached) before.push(child);
                    else after.push(child);
                } else {
                    textReached = true;
                }
            });
            return { before, after };
        };
    }

    public get relatedEscapes(): RelatedAnsiEscapes  {
        return this.memoized.getMemoizedData('relatedEscapes');
    }

    public get raw(): string {
        return this.memoized.getMemoizedData('raw');
    }

    public get plainTextChildren(): PlainTextChunkNode[]  {
        return this.memoized.getMemoizedData('plainTextChildren');
    }

    public toJSON(): object;
    public toJSON(strategy: SerializeStrategy): object;
    public toJSON(strategy: SerializeStrategy = 'Data_Extended'): object {
        const extended = (strategy === 'Display_Extended' || strategy === 'Data_Extended');
        const display = (strategy === 'Display' || strategy === 'Display_Extended');
        const result: any = {
            ...super.toJSON(strategy),
            style: this.style
        };

        if (display || extended) {
            if (display && !extended) {
                result.plainTextChildren = ' [...] ';
                result.relatedEscapes = ' [...] ';
            } else if (extended) {
                result.plainTextChildren = this.plainTextChildren.map(child => child.toJSON(strategy)),
                result.relatedEscapes = {
                    after: this.relatedEscapes.after.map(esc => esc.toJSON(strategy)),
                    before:  this.relatedEscapes.before.map(esc => esc.toJSON(strategy)),
                };
            }
        }
        return result;
    }
}