import { Serializable, SerializeStrategy, defaultSerializeStrategy, minVerbosity, Verbosity } from './miscInterfaces';

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

    public clone(): Location {
        return new Location({
            line: this.line,
            column: this.column,
            offset: this.offset,
            plainTextOffset: this.plainTextOffset
        });
    }

    public toJSON(): object;
    public toJSON(strategy: Partial<SerializeStrategy>): object;
    public toJSON(strategy: Partial<SerializeStrategy> = {}): object {
        const strat = { ...defaultSerializeStrategy, ...strategy };

        const result: any = {
            line: this.line,
            column: this.column
        };

        if (minVerbosity(strat.verbosity, 'extended')) {
            result.offset = this.offset;
            if (strat.verbosity === 'full') {
                result.plainTextOffset = this.offset;
            }
        }

        return result;
    }

    public toString(): string;
    public toString(verbosity: Verbosity): string;
    public toString(verbosity: Verbosity = 'extended'): string {
        if (verbosity === 'minimal') {
            return String(this.offset);
        } else if (verbosity === 'extended') {
            return  `${this.offset}[${this.line}:${this.column}]`;
        } else if (verbosity === 'full') {
            return  `${this.offset}[${this.line}:${this.column}]`;
        } else {
            throw new TypeError();
        }
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

    public clone(): CompoundLocation {
        return new CompoundLocation({
            line: this.line,
            column: this.column,
            offset: this.offset,
            plainTextOffset: this.plainTextOffset,
            relative: this.relative.clone()
        });
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
