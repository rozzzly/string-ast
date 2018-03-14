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

export type Proposal = Constructor<{ name: string }>;
export type ProposalName<C extends Proposal> = Instance<C>['name'];

export type SubmittedProposals<C extends Proposal, K extends ProposalName<C> = ProposalName<C>> = {
    [N in K]: Deconstruct<C, DiscriminateUnion<Instance<C>, 'name', N>>;
};

export type Enact<C extends Proposal> = {
    enact<K extends keyof SubmittedProposals<C>, I extends Instance<SubmittedProposals<C>[K]>>(plan: I): I;
    enact<K extends keyof SubmittedProposals<C>>(proposalName: K): Instance<SubmittedProposals<C>[K]>;
};

export type Scenario<C extends Proposal> = (
    & SubmittedProposals<C>
    & Enact<C>
);

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type ExtractProposals<S> = (
    (S extends Scenario<infer C>
        ? C
        : never
    )
);

export type Implementation<S extends Scenario<Constructor>, C extends ExtractProposals<S> = ExtractProposals<S>> = (
   | Instance<C>
   | ProposalName<C>
);

export function scenario<C extends Proposal>(proposals: C[]): Scenario<C> {
    const aliases: (ProposalName<C>)[] = [];
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
