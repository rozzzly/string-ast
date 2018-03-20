export type Invalidated = typeof Invalidated;
export const Invalidated: unique symbol = Symbol('[string-ast]::AST/Node.Memoizer.data(Invalidated)');

export const ArgOmitted: unique symbol = Symbol('[string-ast]::ArgOmitted');
export type ArgOmitted = typeof ArgOmitted;


export type ComputerMap<D extends {}, S extends object> = {
    [K in keyof D]: (self: S) => D[K];
};

export type InvalidatableDataMap<D extends {}> = {
    [K in keyof D]: D[K] | Invalidated;
};

export class Memoizer<D extends {}, S extends object>  {

    private data: InvalidatableDataMap<D> = {} as D;
    private computers: ComputerMap<D, S> = {} as ComputerMap<D, S>;
    private keyWhitelist: Set<keyof D>;
    private self: S;

    public constructor(selfRef: S);
    public constructor(selfRef: S, computers: ComputerMap<D, S>);
    public constructor(selfRef: S, computers: ComputerMap<D, S> = {} as ComputerMap<D, S>) {
        this.self = selfRef;
        this.keyWhitelist = new Set();
        this.patch(computers);
    }

    public patch<K extends keyof D>(computers: Partial<ComputerMap<D, S>>): void;
    public patch<K extends keyof D>(key: K, computer: (self: S) => D[K]): void;
    public patch(...args: any[]): void {
        if (args.length === 2) {
            const [key, computer] = args as [keyof D, (self: S) => D[keyof D]];
            if (typeof key === 'string' && key.length > 0) {
                this.keyWhitelist.add(key);
                this.computers[key] = computer;
                this.data[key] = Invalidated;
            } else {
                throw new TypeError();
            }
        } else if (args.length === 1) {
            // could recurse, but lets save `args[0].length` stack frames
            const keys = Object.keys(args[0]) as (keyof D)[];
            keys.forEach(key => {
                if (typeof key === 'string' && key.length > 0) {
                    this.keyWhitelist.add(key);
                    this.computers[key] = args[0][key];
                    this.data[key] = Invalidated;
                } else {
                    throw new TypeError('Key must be a non-empty string');
                }
            });
        } else throw new TypeError();
    }

    public invalidate(): void;
    public invalidate(key: keyof D): void;
    public invalidate(subject?: keyof D): void {
        if (subject) {
            this.checkKey(subject);
            this.data[subject] = Invalidated;
        } else {
            this.keyWhitelist.forEach(key => {
                this.data[key] = Invalidated;
            });
        }
    }

    public isInvalidated(): boolean;
    public isInvalidated(key: keyof D): boolean;
    public isInvalidated(subject?: keyof D): boolean {
        if (subject) {
            this.checkKey(subject);
            return this.data[subject] === Invalidated;
        } else {
            return Array.from(this.keyWhitelist).some(key => this.data[key] === Invalidated);
        }
    }

    public set<K extends keyof D>(key: K, value: D[K]): void {
        this.checkKey(key);
        this.data[key] = value;
    }

    public get<K extends keyof D>(key: K): D[K] {
        if (this.isInvalidated(key)) this.compute(key);
        return this.data[key] as D[K];
    }

    public compute(key: keyof D): void {
        this.checkKey(key);
        this.set(key, this.computers[key](this.self));
    }

    private checkKey(key: keyof D): void | never;
    private checkKey(keys: (keyof D)[]): void | never;
    private checkKey(arg: keyof D | (keyof D)[]): void | never {
        const keyIsGood = ((Array.isArray(arg))
            ? arg.every(key => this.keyWhitelist.has(key))
            : this.keyWhitelist.has(arg)
        );
        if (!keyIsGood) {
            const badKey = ((Array.isArray(arg))
                ? arg.find(key => this.keyWhitelist.has(key))
                : arg
            );
            throw new ReferenceError(`No computer for '${badKey}'.`);
        }
    }
}

