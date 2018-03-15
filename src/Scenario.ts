export type Constructor<I = any> = new (...args: any[]) => I;
export type Instance<C extends Constructor> = C extends new (...args: any[]) => infer I ? I : never;
export type Deconstruct<C, I> = C extends new (...args: any[]) => I  ? C : never;

export type Unionize<T extends { [I: string]: any }> = T[keyof T];

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

export type Proposal = { name: string };
export type ProposalName<P extends Constructor<Proposal>> = Instance<P>['name'];

export type SubmittedProposals<P extends Constructor<Proposal>> = {
    [N in ProposalName<P>]: Deconstruct<P, DiscriminateUnion<Instance<P>, 'name', N>>;
};

export type Enact<P extends Constructor<Proposal>> = {
    enact<K extends keyof SubmittedProposals<P>, I extends Instance<SubmittedProposals<P>[K]>>(plan: I): I;
    enact<K extends ProposalName<P>>(proposalName: K): Instance<SubmittedProposals<P>[K]>;
    enact(either: ProposalName<P> | Instance<P>): Instance<P>
};

export type Scenario<P extends Constructor<{ name: string }>> = (
    & SubmittedProposals<P>
    & Enact<P>
);

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type ExtractProposals<S extends Scenario<any>> = (
    Omit<S, 'enact'>
);

export type Implementation<S extends Scenario<any>, E extends ExtractProposals<S> = ExtractProposals<S>> = (
   | Instance<E[keyof E]>
   | ProposalName<E[keyof E]>
);

export function scenario<P extends Constructor<Proposal>>(proposals: P[]): Scenario<P> {
    const aliases: (ProposalName<P>)[] = [];
    const submittedProposals: any = {};

    proposals.forEach(PlanConstructor => {
        const name = (new PlanConstructor()).name;
        if (typeof name !== 'string') { // also catches undefined props which are... well `undefined`
            throw TypeError('A Proposal must have a (string) name!!');
        } else if (name === '') {
            throw TypeError('A Proposal must have a name!!');
        } else if (name === 'enact') {
            throw TypeError('A Proposal cannot be named `enact`!');
        } else if (aliases.includes(name)) {
            throw TypeError('A Proposal with this name already exists!');
        } else {
            submittedProposals[name] = PlanConstructor;
            aliases.push(name);
        }
    });
    return {
        ...submittedProposals,
        enact(value: any) { // type signature defined in `Scenario` interface
            if (typeof value === 'string' && value !== 'enact') {
                const PlanConstructor = submittedProposals[value];
                if (PlanConstructor) {
                    return new PlanConstructor();
                } else {
                    throw new TypeError('Unregistered Plan name');
                }
            } else {
                if (aliases.includes(value.name) && value instanceof submittedProposals[value.name]) {
                    return value;
                } else {
                    // we were not given an instance of one of the predefined constructors
                    throw new TypeError('Supplied neither name of nor instance of a registered Plan');
                }

            }
        }
    };
}
