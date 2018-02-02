import { ChunkNode, PlainTextChunkNode, NewLineChunkNode } from './AST';

export type SplitQueue = (
    (
        | string
        | NewLineChunkNode
        | PlainTextChunkNode
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
    onMatch?(match: string, parent: ChunkNode): PlainTextChunkNode | NewLineChunkNode;
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
    onMatch(match, parent): NewLineChunkNode {
        return new NewLineChunkNode()
    }
};

export const strategies: SplitStrategy[] = [
    NewLineSplit
];


export function splitText(str: string, parent: ChunkNode): ChunkNode[] {
    let splitQueue: SplitQueue = [str];

    // handle `RegExp`s first
    strategies.filter((strategy): strategy is RegExpSplitStrategy => strategy.type === 'RegExp').forEach(strategy => {
        const pass: SplitQueue = [];
        splitQueue.forEach(item => {
            if (typeof item === 'string') {
                const splits = item.split(strategy.pattern);
                if (strategy.onMatch) {
                    splits.forEach(split => {
                        if (split.match(strategy.pattern)) {
                            pass.push(strategy.onMatch(split, parent));
                        } else {
                            pass.push(split);
                        }
                    });
                }
            } else {
                pass.push(item);
            }
        });
        splitQueue = pass;
    });

    /// TODO ::: preform another pass ==> JoiningSplitStrategy
    /// TODO ::: preform another pass ==> CustomSplitStrategy
    /// TODO ::: preform another pass ==> Array.from(...).map(char => new CharacterNode(parent))

    const result: VisibleTextUnitNode[] = [];
    return result;
}