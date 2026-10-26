import { favouritesToMarkdownJson, getHistory } from './lib.js';
import { getNotionPageAsMarkdown, saveNotionPageAsMarkdown } from './notion.js';
// import history from './history.json' with { type: 'json' };

const notionMarkdown = await getNotionPageAsMarkdown();
const history = getHistory(notionMarkdown);
const { markdown } = await favouritesToMarkdownJson(history);

await saveNotionPageAsMarkdown(markdown);
