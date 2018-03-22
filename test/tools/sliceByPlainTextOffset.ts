import test from 'ava';
import chalk from 'chalk';
import { parse } from '../../src';
import { sliceByPlainTextOffset } from '../../src/tools/slice';
import { debug } from 'util';

test('slice a completely-plaintext string by plainTextOffset', t => {
    const str: string = 'once upon a time';
    const ast = parse(str);

    const sliced = sliceByPlainTextOffset(ast,  5);

    t.is(sliced.range.stop.plainTextOffset, 11);
    t.is(sliced.raw, 'upon a time');
    t.is(sliced.children.length, 1);
});


test('slice a mixed string by plainTextOffset where slice bounds do not create a partial TextSpan', t => {
    const str: string = `${chalk.bgYellow('once')} upon a time`;
    const ast = parse(str);

    const sliced = sliceByPlainTextOffset(ast,  5);

    console.log(sliced);

    t.is(sliced.range.stop.plainTextOffset, 11);
    t.is(sliced.raw, 'upon a time');
    t.is(sliced.children.length, 1);
});

test('slice a mixed string by plainTextOffset where slice bounds do create a partial TextSpan', t => {
    const str: string = `${chalk.green('once')} upon a time`;
    const ast = parse(str);

    const sliced = sliceByPlainTextOffset(ast,  1);

    console.log(sliced);

    t.is(sliced.range.stop.plainTextOffset, 15);
    t.is(sliced.raw, `${chalk.green('nce')} upon a time`);
    t.is(sliced.children.length, 2);
});