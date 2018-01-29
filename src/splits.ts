import { VisibleTextUnitNode, TextNode } from './AST';

export type SplitQueue = (
    (
        | string
        | VisibleTextUnitNode
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
    pattern: RegExp;
    onMatch?(match: string, parent: TextNode): TextNode;
}

export interface JoiningSplitStrategy extends BaseSplitStrategy<'Joining'> {
    pattern: RegExp[];
}

export interface CustomSplitStrategy extends BaseSplitStrategy<'Custom'> {
    split(queue: SplitQueue): SplitQueue;
}

export type SplitStrategy = (
    | RegExpSplitStrategy
    | JoiningSplitStrategy
    | CustomSplitStrategy
);

const NewLineSplit: RegExpSplitStrategy = {
    type: 'RegExp',
    name: 'NewLine',
    pattern: /(\u000A|(?:\r?\n))/u
};

export const strategies: SplitStrategy[] = [
    NewLineSplit
];


export function splitText(str: string, parent: TextNode): VisibleTextUnitNode[] {
    let splitQueue: SplitQueue = [str];

    // handle `RegExp`s first
    strategies.filter(strategy => strategy.type === 'RegExp').forEach(strategy => {
        const pass: SplitQueue = [];
        splitQueue.forEach(item => {
            if (typeof item === 'string') {
                const splits = item.split(strategy.pattern);
                if (strategy.onMatch) {
                    splits.forEach(split => {
                        if (split.match(strategy.pattern)) {
                            pass.push(strategy.onMatch(split));
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
    /// TODO ::: prefrom another pass ==> Array.from().map(char => new CharacterNode(parent))

    const result: VisibleTextUnitNode[] = [];
    return result;
}