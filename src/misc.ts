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