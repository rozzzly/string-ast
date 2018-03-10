/**
 * @param {number} lowerLimit the lower bound (inclusive by default)
 * @param {number} upperLimit the upper bound (inclusive by default)
 * @param {number} value value to test to see if is in range
 * @returns {boolean} wether or nor value is in the given range
 */
export function inRange(lowerLimit: number, upperLimit: number, value: number): boolean;
/**
 * @param {number} lowerLimit the lower bound (exclusivity dependant on `isExclusive` param)
 * @param {number} upperLimit the upper bound (exclusivity dependant on `isExclusive` param)
 * @param {number} value value to test to see if is in range
 * @param {boolean = false} isExclusive wether or now the upper/lower bound are exclusive (default: false)
 * @returns {boolean} wether or nor value is in the given range
 */
export function inRange(lowerLimit: number, upperLimit: number, value: number, isExclusive: boolean): boolean;
export function inRange(lowerLimit: number, upperLimit: number, value: number, isExclusive: boolean = false): boolean {
    return (
        isExclusive && (
            value > lowerLimit && value < upperLimit
        ) || (
            value >= lowerLimit && value <= upperLimit
        )
    );
}

export type ContiguousPredicate<C, P extends C> = (current: C, previous: P, soFar: P[], all: C[]) => boolean;
export function groupContiguous<C, P extends C>(group: C[], predicate: ContiguousPredicate<C, P>): C[][] {
    const result: C[][] = [];
    let soFar: P[];
    let previous: undefined;

    group.forEach((value: C, index: number) => {
        if (soFar.length === 0) soFar.push(value as P);
        else {
            if (predicate(value, soFar[soFar.length - 1], soFar, group)) {
                soFar.push(value as P);
            } else {
                result.push(soFar);
                soFar = [];
            }
        }
    });
    // if last item tested matched the existing group
    if (soFar.length) result.push(soFar);

    return result;
}

export function atLeast<T>(levels: T[]): (value: T, minimum: T) => boolean {
    return (value: T, minimum: T): boolean => {
        const valIndex: number = levels.indexOf(value);
        const minIndex: number = levels.indexOf(minimum);
        if (valIndex === -1 || minIndex === -1) throw new TypeError('Unexpected Level');
        else return (valIndex >= minIndex);
    };
}


export function atMost<T>(levels: T[]): (value: T, minimum: T) => boolean {
    return (value: T, minimum: T): boolean => {
        const valIndex: number = levels.indexOf(value);
        const minIndex: number = levels.indexOf(minimum);
        if (valIndex === -1 || minIndex === -1) throw new TypeError('Unexpected Level');
        else return (valIndex <= minIndex);
    };
}

export type StrUnion<
    A extends string = undefined,
    B extends string = undefined,
    C extends string = undefined,
    D extends string = undefined,
    E extends string = undefined,
    F extends string = undefined
> = Exclude<(
    | A
    | B
    | C
    | D
    | E
    | F
), undefined>;


export type ClassConstructor<I, C extends { new (): I } = { new(): I}> = C;


export type ApproachMap<K extends string> = {
    [N in K]: ClassConstructor<Strategy<N>>;
};

export class Scenario<K extends string, M extends ApproachMap<K> = ApproachMap<K>> {
    public name: string;
    public approaches: M;
    private approachNames: K[];
    public constructor(name: string, approaches: M) {
        this.name = name;
        this.approaches = approaches;
        this.approachNames = Object.keys(this.approaches) as K[];
        this.approachNames.forEach(app => {
            this.approaches[app].prototype.scenario = this;
        })
    }

    public inflate<N extends K>(order: N): M[N];
    public inflate<N extends K, I extends M[N]>(order: I): I;
    public inflate<N extends K, I extends M[N] = M[N]>(order: I | N): I | M[N] {
        const names: K[] = Object.keys(this.approaches) as A[];
        if (typeof order === 'string') {
            // use default instance
            const inst: Strategy<A, this, N> = new this.approaches[order]();
            if (inst) return inst;
            else throw new TypeError();
        } else {
            if (names.includes(order.name)) { // approach with that name exists
                return order; // use given instance anyway
            } else throw TypeError();
        }
    }
}

export abstract class Strategy<N extends String> {
    public options: {};
    public abstract name: N;
    protected scenario: Scenario<any, any>;

    public constructor(opts: {} = {}) {
        this.options = opts;
    }
}

class SomePlanOfAction extends Strategy<'SomePlanOfAction'> {
    public name: 'SomePlanOfAction' = 'SomePlanOfAction';
    public constructor(arg: number = 1) {
        super();
    }
}

const foo = new Scenario<'SomePlanOfAction', {
    SomePlanOfAction: SomePlanOfAction
}>('derp', {
    SomePlanOfAction: SomePlanOfAction
});

const lol = new foo.approaches.SomePlanOfAction(5);