import { SerializeStrategy, Serializable } from './miscInterfaces';
import { Location, CompoundLocation } from './Location';

export interface RangeData {
    start: Location;
    stop: Location;
}

export class Range implements RangeData, Serializable {

    public start: Location;
    public stop: Location;

    public constructor();
    public constructor(start: Location, stop: Location);
    public constructor(start?: Location, stop?: Location) {
        this.start = start;
        this.stop = stop;
    }

    public clone(): Range {
        return new Range(this.start.clone(), this.stop.clone());
    }

    public toString(): string {
        return `${this.start}-${this.stop}`;
    }

    public toJSON(): object {
        return {
            start: this.start.toJSON(),
            end: this.start.toJSON()
        };
    }
}

export interface CompoundRangeData extends RangeData {
    start: CompoundLocation;
    stop: CompoundLocation;
}

export class CompoundRange extends Range implements CompoundRangeData {

    public start: CompoundLocation;
    public stop: CompoundLocation;

    public constructor();
    public constructor(start: CompoundLocation, stop: CompoundLocation);
    public constructor(start?: CompoundLocation, stop?: CompoundLocation) {
        super(start, stop);
    }

    public toString(): string {
        return `${this.start.toString(true)}-${this.stop.toString(true)} <Relative: ${this.start.relative}-${this.stop.relative}>`;
    }

}
