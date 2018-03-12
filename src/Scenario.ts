export type Constructor<I = any> = new (...args: any[]) => I;
export type Instance<C> = C extends new (...args: any[]) => infer I ? I : never;



export type DiscriminateUnion<
    Union,
    TagKey extends keyof Union,
    TagValue extends Union[TagKey]
> = (
    Union extends Record<TagKey, TagValue>
        ? Union
        : never
);

type lookup<P extends Constructor<{ name: string }>[], N extends Instance<P[number]>['name']> = DiscriminateUnion<Instance<P[number]>, 'name', N>;

export interface Proposals {
    [name: string]: Constructor<{ name: string }>;
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



export function scenario<P extends Proposals>(name: string, plans: P): Scenario<P> {
    const aliases = Object.keys(plans);
    return {
        plans: plans,
        name: name,
        enact(value: any) { // type signature defined in `Scenario` interface
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
