console.log('autoResolve2 module entered');

export async function autoResolve(): Promise<string | false> {
    console.log('custom autoResolve2 triggered');
    return 'fooBar';
}