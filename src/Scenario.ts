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
