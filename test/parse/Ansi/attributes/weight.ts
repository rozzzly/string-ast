import test from 'ava';
import chalk from 'chalk';
import { parse } from '../../../../src';
import { AnsiTextSpanNode } from '../../../../src/AST/TextSpanNode/AnsiTextSpanNode';
import { PlainTextSpanNode } from '../../../../src/AST/TextSpanNode/PlainTextSpanNode';
import { Colors } from '../../../../src/Ansi/AnsiColor';


test('chalk wrapped string with bold text', t => {
    const str: string = `normal ${chalk.bold('bold')} normal`;
    const ast = parse(str);

    t.is(ast.children.length, 3);
    const node: AnsiTextSpanNode = ast.children.get(1);
    t.is(node.kind, 'AnsiTextSpanNode');
    t.true(node.style.bold);
    t.is(node.style.weight, 'bold');
});

test('nested chalk string with colored text inside bold text', t => {
    const str: string = `normal ${chalk.bold(`bold ${chalk.red('boldRed')}`)} normal`;
    const ast = parse(str);

    t.is(ast.children.length, 4);

    const boldNode: AnsiTextSpanNode = ast.children.get(1);
    const boldRedNode: AnsiTextSpanNode = ast.children.get(2);
    const finalNode: PlainTextSpanNode = ast.children.get(3);

    t.is(boldNode.kind, 'AnsiTextSpanNode');
    t.true(boldNode.style.bold);
    t.is(boldNode.style.weight, 'bold');

    t.is(boldRedNode.kind, 'AnsiTextSpanNode');
    t.true(boldRedNode.style.bold);
    t.true(Colors.fg.RED.equalTo(boldRedNode.style.fgColor));
    t.is(boldRedNode.style.weight, 'bold');

    t.is(finalNode.kind, 'PlainTextSpanNode');
});
