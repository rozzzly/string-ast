# string-ast

Ever tried to manipulate a string containing weird Unicode characters (emojis, CJK, etc)
or the ANSI escape sequences used to make console output colorized? It can be a real pain.
This package is my attempt to make that easier. By building a comprehensive AST, it becomes
possible to preform declarative operations on ANSI/Unicode strings as if they were just ASCII.

-------------------------

### Installation
```bash
npm install string-ast
```

#### Usage
```javascript
import parse from 'string-ast';
import chalk from 'chalk';

const str = `normal ${chalk.bold('bold')} ${chalk.red(`red ${chalk.bold('both')}`)}`;
console.log(parse(str));
```



##### Prior Art & Resources Used
https://mathiasbynens.be/notes/javascript-unicode
https://github.com/sallar/stringz