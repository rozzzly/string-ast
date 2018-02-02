import test from 'ava';
import chalk from 'chalk';
import { parse } from '../../src';

test('AnsiTextChunkNode surrounded by PlainTextChunkNode', t => {
    const str: string = `Plaintext ${chalk.red('AnsiText')} PlainText`;
    const ast = parse(str);

    t.is(ast.kind, 'RootNode');
    t.is(ast.children.length, 3);
    t.is(ast.children[0].kind, 'PlainTextChunkNode');
    t.is(ast.children[1].kind, 'AnsiTextChunkNode');
    t.is(ast.children[2].kind, 'PlainTextChunkNode');
});

test('PlainTextChunkNode before an AnsiTextChunkNode', t => {
    const str: string = `Plaintext ${chalk.red('AnsiText')}`;
    const ast = parse(str);

    t.is(ast.kind, 'RootNode');
    t.is(ast.children.length, 2);
    t.is(ast.children[0].kind, 'PlainTextChunkNode');
    t.is(ast.children[1].kind, 'AnsiTextChunkNode');
});

test('AnsiTextChunkNode before a PlainTextChunkNode', t => {
    const str: string = `${chalk.red('AnsiText')} Plaintext`;
    const ast = parse(str);

    t.is(ast.kind, 'RootNode');
    t.is(ast.children.length, 2);
    t.is(ast.children[0].kind, 'AnsiTextChunkNode');
    t.is(ast.children[1].kind, 'PlainTextChunkNode');
});