import test from 'ava';
import { splitText } from '../../src/splits';
import { CharacterNode } from '../../src/AST/TextChunkNode/CharacterNode';
import { NewLineEscapeNode } from '../../src/AST/TextChunkNode/NewLineEscapeNode';

test('Split a string into CharacterNode[]', t => {
    const str: string = 'Some Text';
    const split = splitText(str, undefined);
    t.is(split.length, 9);
    t.true(split[0] instanceof CharacterNode);
    t.is(split[0].value, 'S');
    t.true(split[8] instanceof CharacterNode);
    t.is(split[8].value, 't');
});

test('Splits string containing a newline out into (NewLineEscapeNode | CharacterNode)[]', t => {
    const str: string = 'Some\r\nText';
    const split = splitText(str, undefined);
    t.is(split.length, 9);
    t.true(split[4] instanceof NewLineEscapeNode);
    t.is(split[4].value, '\r\n');
});

