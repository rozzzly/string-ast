export type Constructor<I = any> = new (...args: any[]) => I;
export type Instance<C extends Constructor> = C extends new (...args: any[]) => infer I ? I : never;

export type Deconstruct<U, I> = U extends new (...args: any[]) => I  ? U : never;

export type DiscriminateUnion<
    Union,
    TagKey extends keyof Union,
    TagValue extends Union[TagKey]
> = (
    (Union extends Record<TagKey, TagValue>
        ? Union
        : never
    )
);

export type lookup<P extends Constructor<{ name: string }>[], N extends Instance<P[number]>['name']> = DiscriminateUnion<Instance<P[number]>, 'name', N>;

export type Proposals2<C extends  Constructor<{ name: string }>> = {
    [N in Instance<C>['name']]: Deconstruct<C, DiscriminateUnion<Instance<C>, 'name', N>>;
};

export interface Proposals {
    [name: string]: Constructor<{ name: string }>;
}

type test = Proposals2<[Foo, Bar]>;

export interface Scenario2<C extends Constructor<{ name: string }>> {
    name: string;
    plans:  Proposals2<C>;
    enact<K extends keyof Proposals2<C>, I extends Instance<Proposals2<C>[K]>>(value: I): I;
    enact<K extends keyof Proposals2<C>>(value: K): Instance<Proposals2<C>[K]>;
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

class Foo {
    public name: 'Foo' = 'Foo';
}
class Bar {
    public name: 'Bar' = 'Bar';
}
const p = { Foo, Bar };
const s = scenario('', p);
s.enact(new Foo());



type die = lookup<[typeof Foo, typeof Bar], 'Foo'>;

function hello<P extends Constructor<{ name: string }>[], N extends Instance<P[number]>['name']>(z: P, i: N):   {
    return undefined;
}


const loo = hello([Foo, Bar]);



export function scenario<C extends Constructor<{ name: string }>>(name: string, plans: C[]): Scenario2<C> {
    const aliases: (keyof Proposals2<C>)[] = [];
    const planMap = Proposals.
    
    plans.reduce((reduction, plan) => ({
        ...reduction,
        [new plan().name]: plan
    }), [{}) as (Proposals2<C>);
    return {
        plans: planMap,
        name: name,
        enact(value: any) { // type signature defined in `Scenario` interface
            if (typeof value === 'string') {
                if (aliases.includes(value)) {
                    return new planMap[value as keyof Proposals2<C>]();
                } else {
                    throw new TypeError();
                }
            } else {
                // we can probably save some time by checking things with matching names
                const className = value.constructor.name;
                if (aliases.includes(className)) {
                    const ClassConstructor = plans[className as keyof P];
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

const derp = scenario('hi', [Foo, Bar]);

const nDerp = new derp.plans.Bar();