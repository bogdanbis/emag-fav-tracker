// @ts-nocheck
import { writeFile } from 'fs/promises';
import { favouritesToMarkdownJson } from './lib.js';
import history from './history.json' with { type: 'json' };

const { markdown, json } = await favouritesToMarkdownJson(history);

const PATH = '/Users/bogdannegoita/Code/emag-fav-price-tracker';

console.log('Writing JSON to file "history.json"');
await writeFile(PATH + '/history.json', json, 'utf8');
console.log('Done.');

console.log('Writing Markdown text to file "products.md"');
await writeFile(PATH + '/products.md', markdown, 'utf8');
console.log('Done.');
