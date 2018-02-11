import test from 'ava';
import { splitText } from '../../src/splits';
import { CharacterNode } from '../../src/AST/TextChunkNode/CharacterNode';

test('Split a string into CharacterNode[]', t => {
    const str: string = 'Some Text';
    const split = splitText(str, undefined);
    t.is(split.length, 9);
    t.true(split[0] instanceof CharacterNode);
    t.is(split[0].value, 'S');
    t.true(split[8] instanceof CharacterNode);
    t.is(split[8].value, 't');
});