export type InvalidationMap<D extends object> = (
    | true
    | {
        [K in keyof D]?: boolean;
    }
);

export type ComputerMap<D extends {}, S extends object> = {
    [K in keyof D]?: (self: S) => D[K];
};

export function memoizeClass(computers: {}):  any {
    console.log(computers);
    return <T extends { new(...args: any[]): {} }>(base: T): T => {
        return class extends base {
            constructor(...args: any[]) {
                super(...args);
                (this as any).memoizer = (this as any).memoizer || new Memoizer<any, any>(this);
                (this as any).memoizer.computers = { ...(this as any).memoizer.computers, ...computers };
            }
        };
    } ;
}

export class Memoizer<D extends {}, S extends object>  {

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

