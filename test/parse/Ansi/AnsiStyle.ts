import chalk from 'chalk';
import test from 'ava';

import { parse } from '../../../src';
import { AnsiTextSpanNode } from '../../../src/AST/TextSpanNode/AnsiTextSpanNode';
import { AnsiStyle } from '../../../src/Ansi/AnsiStyle';
import { Colors } from '../../../src/Ansi/AnsiColor';

test('correctly parsing styles of a chalk-wrapped string', t => {
    const str: string = chalk.red.bold('some text');
    const ast = parse(str);

    const node: AnsiTextSpanNode = ast.children.get(0);
    const style: AnsiStyle = node.style;
    t.truthy(style);
    t.true(style.fgColor.equalTo(Colors.fg.RED));
    t.is(style.weight, 'bold');
});