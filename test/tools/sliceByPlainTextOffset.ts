import test from 'ava';
import { parse } from '../../src';
import { sliceByPlainTextOffset } from '../../src/tools/slice';
import { debug } from 'util';

test.skip('slice a completely-plaintext ASCII string', t => {
    const str: string = 'once upon a time';
    const ast = parse(str);

    // tslint:disable-next-line:no-debugger
    debugger;
    // const sliced = sliceByPlainTextOffset(ast,  5);

    // // console.log(sliced);

    // t.is(sliced.range.stop.plainTextOffset, 11);
    // t.is(sliced.raw, 'upon a time');
    // t.is(sliced.children.length, 1);

});