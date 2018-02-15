
export type InvalidationMap<D extends object> = (
    | true
    | {
        [K in keyof D]?: boolean;
    }
);

export type ComputerMap<D extends {}, S extends object> = {
    [K in keyof D]?: (self: S) => D[K];
};

export type TypedClassConstructor<C> = {
    new(...args: any[]): C
};
export interface TypedClassConstructor0<C, Arg0> {
    new(arg0: Arg0): C;
}
export interface TypedClassConstructor1<C, Arg0, Arg1> {
    new(arg0: Arg0): C;
}
export interface TypedClassConstructor2<C, Arg0, Arg1, Arg2> {
    new(arg0: Arg0): C;
}
export interface TypedClassConstructor3<C, Arg0, Arg1, Arg2, Arg3> {
    new(arg0: Arg0, arg1: Arg1, arg2: Arg2, arg3: Arg3): C;
}


export type TypedClassDecorator<C extends TypedClassConstructor<C>> = (target: C) => C | void;

export type TypedArgs<F> = (
   F extends { new(arg0: infer Arg0): any } ? TypedClassConstructor0<F, Arg0> :
   F extends { new(arg0: infer Arg0, arg1: infer Arg1): any } ? TypedClassConstructor1<F, Arg0, Arg1> :
   never
);

function foo(param: 'derp', num: number): any {
    return;
}

type test<A extends TypedArgs<typeof foo>> = (...args: A) => any;

export interface UniversalDecoratorDefinition<T extends TypedClassConstructor<T>> {
    <A extends []>(...args: A[]): TypedClassDecorator<T>;
}

class Foo {
    public a: number;
    public constructor(a: number) {
        this.a = a;
    }
}

type fake = {
    a: number;
    new (): fake;
}

const derp: UniversalDecoratorDefinition<Foo> = (): Foo
// export function memoize<T extends { new(...args: any[]): T}>(target: object, name: PropertyKey, descriptor: PropertyDecorator): void {

// }

export class Memorizer<D extends {}, S extends object>  {

    public data: D = { } as D;
    public computers: ComputerMap<D, S> = {};
    public invalidated: InvalidationMap<D> = true;
    private self: S;

    public constructor(selfRef: S) {
        this.self = selfRef;
    }


    public invalidate(): void;
    public invalidate(key: keyof D): void;
    public invalidate(key?: keyof D): void {
        if (key && this.invalidated !== true) {
            this.invalidated[key] = true;
        } else {
            this.invalidated = true;
        }
    }

    public isInvalidated(): boolean;
    public isInvalidated(key: keyof D): boolean;
    public isInvalidated(key?: keyof D): boolean {
        if (this.invalidated === true) return true;
        else {
            if (key) {
                return this.invalidated[key] !== false;
            } else {
                return Object.keys(this.invalidated).some((prop: keyof D) => (this.invalidated as any)[prop] === true);
            }
        }
    }

    public setMemoizedData<K extends keyof D = keyof D>(key: K, value: D[K]): void {
        this.data[key] = value;
        // "un-invalidate" the key which was computed
        if (this.invalidated === true) {
            this.invalidated = { [key]: false } as { [T in keyof D]: boolean };
        } else {
            this.invalidated[key] = false;
        }
    }

    public getMemoizedData<K extends keyof D = keyof D>(key: K): D[K] {
        if (this.isInvalidated(key)) this.compute(key);
        return this.data[key];
    }

    public compute<K extends keyof D>(key: K): void {
        if (!this.computers[key]) {
            throw new ReferenceError(`No computer for '${key}'.`);
        } else {
            this.setMemoizedData(key, this.computers[key](this.self));
        }
    }
}

