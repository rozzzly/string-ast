import * as util from 'util';
import test from 'ava';
import chalk from 'chalk';
import { parse } from '../../src';

test('AnsiTextSpanNode surrounded by PlainTextSpanNode', t => {
    const str: string = `PlainText ${chalk.red.bold('AnsiText')} PlainText`;
    const ast = parse(str);

    console.log(util.inspect(ast, { showHidden: true, depth: 4, colors: true }));
    t.is(ast.kind, 'RootNode');
    t.is(ast.children.length, 3);
    t.is(ast.children[0].kind, 'PlainTextSpanNode');
    t.is(ast.children[1].kind, 'AnsiTextSpanNode');
    t.is(ast.children[2].kind, 'PlainTextSpanNode');
});

test('PlainTextSpanNode before an AnsiTextSpanNode', t => {
    const str: string = `PlainText ${chalk.red('AnsiText')}`;
    const ast = parse(str);

    console.log(util.inspect(ast, { showHidden: true, depth: 4, colors: true }));
    t.is(ast.kind, 'RootNode');
    t.is(ast.children.length, 2);
    t.is(ast.children[0].kind, 'PlainTextSpanNode');
    t.is(ast.children[1].kind, 'AnsiTextSpanNode');
});

test('AnsiTextSpanNode before a PlainTextSpanNode', t => {
    const str: string = `${chalk.red('AnsiText')} PlainText`;
    const ast = parse(str);

    console.log(util.inspect(ast, { showHidden: true, depth: 4, colors: true }));
    t.is(ast.kind, 'RootNode');
    t.is(ast.children.length, 2);
    t.is(ast.children[0].kind, 'AnsiTextSpanNode');
    t.is(ast.children[1].kind, 'PlainTextSpanNode');
});