// @ts-nocheck
import { loadEnvFile } from 'node:process';

try {
    loadEnvFile('.env.local');
} catch (ignored) { }

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY)
    console.log("NOTION_API_KEY not found.");
const NOTION_PAGE_ID= process.env.NOTION_PAGE_ID;
const NOTION_VERSION = process.env.NOTION_VERSION || "2026-03-11";
const URL = `https://api.notion.com/v1/pages/${NOTION_PAGE_ID}/markdown`;


export async function getNotionPageAsMarkdown() {
    console.log('Fetching Notion page as Markdown...');
    const response = await fetch(URL, {
        "headers": {
            "Accept": "application/json",
            "Authorization": "Bearer " + NOTION_API_KEY,
            "Notion-Version": NOTION_VERSION,
        },
    });
    const body = await response.json();
    if (!response.ok) {
        console.log(body);
        throw new Error("Response status: " + response.status);
    }
    console.log('Done.');
    return body.markdown;
}

export async function saveNotionPageAsMarkdown(markdownText) {
    console.log('Saving Markdown text to Notion...');
    const response = await fetch(URL, {
        "method": "PATCH",
        "headers": {
            "Accept": "application/json",
            "Authorization": "Bearer " + NOTION_API_KEY,
            "Content-Type": "application/json",
            "Notion-Version": NOTION_VERSION,
        },
        "body": JSON.stringify({
            type: "replace_content",
            "replace_content": {
                "new_str": markdownText,
            },
        }),
    });
    if (!response.ok) {
        const body = await response.json();
        console.log(body);
        throw new Error("Response status: " + response.status);
    }
    console.log('Done.');
}
