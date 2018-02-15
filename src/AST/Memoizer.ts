export type InvalidationMap<D extends object> = (
    | true
    | {
        [K in keyof D]?: boolean;
    }
);

export type ComputerMap<D extends {}, S extends object> = {
    [K in keyof D]?: (self: S) => D[K];
};

export class Memoizer<D extends {}, S extends object>  {

    public data: D;
    public computers: ComputerMap<D, S>;
    public invalidated: InvalidationMap<D> = true;
    private self: S;

    public constructor(selfRef: S);
    public constructor(selfRef: S, computers: ComputerMap<D, S>);
    public constructor(selfRef: S, computers: ComputerMap<D, S> = {}) {
        this.self = selfRef;
        this.computers = computers;
        this.data = {} as D;
    }

    public patch<K extends keyof D>(computers: ComputerMap<D, S>): void;
    public patch<K extends keyof D>(key: K, computer: (self: S) => D[K]): void;
    public patch(...args: any[]): void {
        if (args.length === 2) {
            (this.computers as any)[args[0]] = args[1];
        } else if (args.length === 1) {
            this.computers = { ...this.computers as any, ...args[0] };
        } else throw new TypeError();
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

