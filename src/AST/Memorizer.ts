
export type InvalidationMap<D extends object> = (
    | true
    | {
        [K in keyof D]?: boolean;
    }
);

export type ComputerMap<D extends {}> = {
    [K in keyof D]?: () => D[K];
};

export class Memorizer<D extends {}>  {

    public invalidated: InvalidationMap<D> = true;
    public data: D = { } as D;
    public computers: ComputerMap<D> = {};

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
                return this.invalidated[key];
            } else {
                return Object.keys(this.invalidated).some((prop: keyof D) => (this.invalidated as any)[prop] === true);
            }
        }
    }

    public setMemoizedData<K extends keyof D = keyof D>(key: K, value: D[K]): void {
        this.data[key] = value;
        // "un-invalidate" the key which was computed
        if (this.invalidated === true) {
            this.invalidated = { [key]: false } as any;
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
            this.setMemoizedData(key, this.computers[key]());
        }
    }
}