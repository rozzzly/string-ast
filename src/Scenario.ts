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

export type Proposals<C extends Constructor<{ name: string }>> = {
    [N in Instance<C>['name']]: Deconstruct<C, DiscriminateUnion<Instance<C>, 'name', N>>;
};

export type Scenario<C extends Constructor<{ name: string }>> = (
    (
        Proposals<C>
    ) & {
        enact<K extends keyof Proposals<C>, I extends Instance<Proposals<C>[K]>>(value: I): I;
        enact<K extends keyof Proposals<C>>(value: K): Instance<Proposals<C>[K]>;
    }
);


export type Implementation<S> = (
    (S extends Scenario<infer P> // extract Proposals
        ? (
            | Instance<P>['name']
            | Instance<P>
        )
        : never
    )
);

class Foo {
    public static something: boolean = false;
    public name: 'Foo' = 'Foo';
    constructor(v: number) {
        console.log(v);
    }
}
class Bar {
    public name: 'Bar' = 'Bar';
}

export function scenario<C extends Constructor<{ name: string }>>(plans: C[]): Scenario<C> {
    const aliases: (keyof Proposals<C>)[] = [];
    const planMap: any = {};

    plans.forEach(PlanConstructor => {
        const planName = (new PlanConstructor()).name;
        if (typeof planName !== 'string') {
            throw TypeError('A plan must have a (string) name!!');
        } else if (planName === '') {
            throw TypeError('A Plan must have a name!!');
        } else if (planName === 'enact') {
            throw TypeError('A Plan cannot be named `enact`!');
        } else if (aliases.includes(planName)) {
            throw TypeError('A Plan with this name already exists!');
        } else {
            planMap[planName] = PlanConstructor;
            aliases.push(planName);
        }
    });
    return {
        ...planMap,
        enact(value: any) { // type signature defined in `Scenario` interface
            if (typeof value === 'string' && value !== 'enact') {
                const ClassConstructor = planMap[value];
                if (ClassConstructor) {
                    return new ClassConstructor();
                } else {
                    throw new TypeError('Unregistered Plan name');
                }
            } else {
                if (aliases.includes(value.name) && value instanceof planMap[value.name]) {
                    return value;
                } else {
                    // we were not given an instance of one of the predefined constructors
                    throw new TypeError('Supplied neither name of nor instance of a registered Plan');
                }

            }
        }
    };
}
