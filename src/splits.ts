import { TextChunkNode } from './AST/TextChunkNode';
import { TextSpanNode } from './AST/TextSpanNode';
import { CharacterNode } from './AST/TextChunkNode/CharacterNode';
import { NewLineEscapeNode } from './AST/TextChunkNode/NewLineEscapeNode';

export type SplitQueue = (
    (
        | string
        | TextChunkNode
    )[]
);

export type SplitStrategyTypes = (
    | 'RegExp'
    | 'Joining'
    | 'Custom'
);

export interface BaseSplitStrategy<T extends SplitStrategyTypes> {
    type: T;
    name: string;
}

export interface RegExpSplitStrategy extends BaseSplitStrategy<'RegExp'> {
    type: 'RegExp';
    pattern: RegExp;
    onMatch?(match: string, parent: TextSpanNode): CharacterNode | NewLineEscapeNode;
}

export interface JoiningSplitStrategy extends BaseSplitStrategy<'Joining'> {
    type: 'Joining';
    pattern: RegExp[];
}

export interface CustomSplitStrategy extends BaseSplitStrategy<'Custom'> {
    type: 'Custom';
    split(queue: SplitQueue): SplitQueue;
}

/*export interface SplitStrategyLookup {
    RegExp: RegExpSplitStrategy;
    Joining: JoiningSplitStrategy;
    Custom: CustomSplitStrategy;
}*/
// export type SplitStrategy<T extends SplitStrategyTypes = SplitStrategyTypes> = SplitStrategyLookupTable[T];

export type SplitStrategy = (
    | RegExpSplitStrategy
    | JoiningSplitStrategy
    | CustomSplitStrategy
);

const NewLineSplit: RegExpSplitStrategy = {
    type: 'RegExp',
    name: 'NewLine',
    pattern: /(\u000A|(?:\r?\n))/u,
    onMatch: (match, parent): NewLineEscapeNode => (
        new NewLineEscapeNode(parent, match)
    )
};

export const strategies: SplitStrategy[] = [
    NewLineSplit
];


export function splitText(str: string, parent: TextSpanNode): TextChunkNode[] {
    let resultQueue: SplitQueue = [str];
    let passQueue: SplitQueue = [];
    // handle `RegExp`s first
    strategies.filter((strategy): strategy is RegExpSplitStrategy => strategy.type === 'RegExp').forEach(strategy => {
        passQueue =  [];
        resultQueue.forEach(item => {
            if (typeof item === 'string') {
                const splits = item.split(strategy.pattern);
                if (strategy.onMatch) {
                    splits.forEach(split => {
                        if (split.match(strategy.pattern)) {
                            passQueue.push(strategy.onMatch(split, parent));
                        } else {
                            passQueue.push(split);
                        }
                    });
                }
            } else {
                passQueue.push(item);
            }
        });
        resultQueue = [...passQueue];
    });

    /// TODO ::: preform another pass ==> JoiningSplitStrategy
    /// TODO ::: preform another pass ==> CustomSplitStrategy
    /// Preform another pass on remaining strings ==> Array.from(...).map(char => new CharacterNode(parent))
    passQueue = [];
    resultQueue.forEach(item => {
        if (typeof item === 'string') {
            const chunks: CharacterNode[] = Array.from(item).map(character => new CharacterNode(parent, character));
            passQueue.push(...chunks);
        } else {
            passQueue.push(item);
        }
    });
    resultQueue = [...passQueue];

    return resultQueue as TextChunkNode[];
}