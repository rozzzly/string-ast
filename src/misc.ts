/**
 * @param {number} lowerLimit the lower bound (inclusive by default)
 * @param {number} upperLimit the upper bound (inclusive by default)
 * @param {number} value value to test to see if is in range
 * @returns {boolean} wether or nor value is in the given range
 */
export function inRange(lowerLimit: number, upperLimit: number, value: number): boolean;
/**
 * @param {number} lowerLimit the lower bound (exclusivity dependant on `isExclusive` param)
 * @param {number} upperLimit the upper bound (exclusivity dependant on `isExclusive` param)
 * @param {number} value value to test to see if is in range
 * @param {boolean = false} isExclusive wether or now the upper/lower bound are exclusive (default: false)
 * @returns {boolean} wether or nor value is in the given range
 */
export function inRange(lowerLimit: number, upperLimit: number, value: number, isExclusive: boolean): boolean;
export function inRange(lowerLimit: number, upperLimit: number, value: number, isExclusive: boolean = false): boolean {
    return (
        isExclusive && (
            value > lowerLimit && value < upperLimit
        ) || (
            value >= lowerLimit && value <= upperLimit
        )
    );
}

export type ContiguousPredicate<C, P extends C> = (current: C, previous: P, soFar: P[], all: C[]) => boolean;
export function groupContiguous<C, P extends C>(group: C[], predicate: ContiguousPredicate<C, P>): C[][] {
    const result: C[][] = [];
    let soFar: P[];
    let previous: undefined;

    group.forEach((value: C, index: number) => {
        if (soFar.length === 0) soFar.push(value as P);
        else {
            if (predicate(value, soFar[soFar.length - 1], soFar, group)) {
                soFar.push(value as P);
            } else {
                result.push(soFar);
                soFar = [];
            }
        }
    });
    // if last item tested matched the existing group
    if (soFar.length) result.push(soFar);

    return result;
}

export function atLeast<T>(levels: T[]): (value: T, minimum: T) => boolean {
    return (value: T, minimum: T): boolean => {
        const valIndex: number = levels.indexOf(value);
        const minIndex: number = levels.indexOf(minimum);
        if (valIndex === -1 || minIndex === -1) throw new TypeError('Unexpected Level');
        else return (valIndex >= minIndex);
    };
}


export function atMost<T>(levels: T[]): (value: T, minimum: T) => boolean {
    return (value: T, minimum: T): boolean => {
        const valIndex: number = levels.indexOf(value);
        const minIndex: number = levels.indexOf(minimum);
        if (valIndex === -1 || minIndex === -1) throw new TypeError('Unexpected Level');
        else return (valIndex <= minIndex);
    };
}