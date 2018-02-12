import chalk from 'chalk';
import test from 'ava';

import { parse } from '../../../src';
import { AnsiTextSpanNode } from '../../../src/AST/TextSpanNode/AnsiTextSpanNode';
import { AnsiStyle } from '../../../src/Ansi/AnsiStyle';
import { Colors } from '../../../src/Ansi/AnsiColor';

test('chalk-wrapped string', t => {
    const str: string = chalk.red.bold('some text');
    const ast = parse(str);

    const node: AnsiTextSpanNode = ast.children.get(0);
    const style: AnsiStyle = node.style;
    t.truthy(style);
    t.true(style.fgColor.equalTo(Colors.fg.RED));
    t.is(style.weight, 'bold');
    t.true(style.bold);
});

test('multiple AnsiTextSpans in a string', t => {
    const str: string = `This is ${chalk.red('red')} and this is ${chalk.greenBright('bright green')}!`;
    const ast = parse(str);

    console.log(ast);

    const red: AnsiTextSpanNode = ast.children.get(1);
    const green: AnsiTextSpanNode = ast.children.get(3);
    t.true(red.style.fgColor.equalTo(Colors.fg.RED));
    t.true(green.style.fgColor.equalTo(Colors.fg.bright.GREEN));
});