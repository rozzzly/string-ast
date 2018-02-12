import { SerializeStrategy, Serializable } from './miscInterfaces';

export interface LocationData {
    line: number;
    column: number;
    offset: number;
    plainTextOffset: number;
}

export class Location implements LocationData, Serializable {

    public line: number;
    public column: number;
    public offset: number;
    public plainTextOffset: number;

    public constructor(location: LocationData) {
        this.line = location.line;
        this.column = location.column;
        this.offset = location.offset;
        this.plainTextOffset = location.plainTextOffset;
    }

    public toJSON(): object {
        return {
            line: this.line,
            column: this.column,
            offset: this.column,
            plainTextOffset: this.plainTextOffset
        };
    }

    public toString(): string {
        return  `${this.line}:${this.column}(${this.offset}/${this.plainTextOffset})`;
    }
}

export interface CompoundLocationData extends LocationData {
    relative: Location; // relative to parent
}

export class CompoundLocation extends Location implements CompoundLocationData {

    public relative: Location;

    public constructor(location: CompoundLocationData) {
        super(location);
        this.relative = location.relative;
    }

    public toJSON(): object {
        return {
            ...super.toJSON(),
            relative: this.relative.toJSON()
        };
    }

    public toString(): string;
    public toString(excludeRelativeInfo: boolean): string;
    public toString(excludeRelativeInfo: boolean = false): string {
        if (excludeRelativeInfo) return super.toString();
        else return `${super.toString()} <Relative: ${this.relative}>`;
    }
}

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
