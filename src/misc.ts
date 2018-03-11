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

class Bar {
    public static sBar: string = 'false';
    public constructor(name: string) {
        console.log(name);
    }
    public die(): void {
        // noop
    }
}
class Foo<A = 'LOL'> {
    public a: A;
    public static sFoo: boolean = false;
    constructor(a: A) {
        this.a = a;
    }
    public meth(): boolean {
        return true;
    }
}

export type Constructor<I = any> = new (...args: any[]) => I;
export type Instance<C> = C extends new (...args: any[]) => infer I ? I : never;



export interface Proposals {
    [name: string]: Constructor;
}
export interface Scenario<P extends Proposals> {
    name: string;
    plans: P;
    enact<K extends keyof P, I extends Instance<P[K]>>(value: I): I;
    enact<K extends keyof P>(value: K): Instance<P[K]>;
}

export type Implementation<S> = (
    (S extends Scenario<infer P> // extract Proposals
        ? (
            | keyof P
            | Instance<P[keyof P]>
        )
        : never
    )
);

export function scenario<P extends Proposals>(name: string, plans: P): Scenario<P> {
    const aliases = Object.keys(plans);
    return {
        plans: plans,
        name: name,
        enact(value: any) { // type signature
            if (typeof value === 'string') {
                if (aliases.includes(value)) {
                    return new plans[value]();
                } else {
                    throw new TypeError();
                }
            } else {
                // we can probably save some time by checking things with matching names
                const className = value.constructor.name;
                if (aliases.includes(className)) {
                    const ClassConstructor = plans[className];
                    if (value instanceof ClassConstructor) {
                        return value;
                    }
                }
                // check to see if its an instance of _any_ of the predefined constructors
                for (let alias of aliases) {
                    const ClassConstructor = plans[alias];
                    if (value instanceof ClassConstructor) {
                        return value;
                    }
                }

                // we were not given an instance of one of the predefined constructors
                throw new TypeError();
            }
        }
    };
}

const testScenario = scenario('foo', {
    Foo, Bar
});


class Foo2 extends testScenario.plans.Foo<'lol'> {
    constructor(name: string) {
        super('lol');
        console.log(name);
    }
    public live(): this {
        return this;
    }
}


type CustomImplementation = Implementation<typeof testScenario>;
function acceptsCustomImplementation(impl: CustomImplementation): void {
    // noop
}

acceptsCustomImplementation('Foo');
///// PASS (OK) ==> one of the defined keys
acceptsCustomImplementation('Bar');
///// PASS (OK) ==> one of the defined keys
acceptsCustomImplementation('RandomValue');
///// FAILS (OK) ==> not one of the defined keys, nor instance of defined constructor
acceptsCustomImplementation(new Date());
///// FAILS (OK) ==> not one of the defined keys, nor instance of defined constructor
acceptsCustomImplementation(new Bar('Kevin'));
///// PASS (OK) ==> instance of one of the defined constructors
acceptsCustomImplementation(new Bar());
///// FAILS (OK) ==> constructor constraint preserved
acceptsCustomImplementation(new Foo2('robert'));
// acceptsCustomImplementation(new Foo2());
///// FAILS (OK) ==> constructor constraint preserved


//herp.enact('Foo').
testScenario.enact(new Foo2('robert')).live().
