## Setup
1. Create a new file `.env` in this project's root (next to `lib.js`).  
2. Install npm packages with `npm i`

### Notion access
1. Create a new blank Notion page
2. Grab the Notion page ID and set it to `NOTION_PAGE_ID`
3. [Create a Notion PAT](https://developers.notion.com/guides/get-started/personal-access-tokens#create-a-pat) or a Notion Connection and grant it access to the page if needed
4. Set the value of `NOTION_API_KEY`

### Emag
1. Visit [emag.ro](https://www.emag.ro) and grab the `user_remember` Cookie **value** using developer tools
2. Set `EMAG_USER_REMEMBER_COOKIE` to the Cookie **value**
3. Get the Emag favourites list ID
    - Set `EMAG_FAV_LIST_ID="type/emag"` if you want to track everything.
    - To get a specific list ID, view the list and grab the ID from the URL.

**Fill in the rest of the `.env` values by following `.env.example`**

### Requirements:
- `node v24 (Krypton)`

## Running the script
Run the script with `node .` or `node index.js`

A successful run log looks like this:
```sh
Fetching Notion page as Markdown...
Done.
Fetching favourites list...
Done.
Fetching offers list...
Done.
Converting products to Markdown...
Done.
Saving Markdown text to Notion...
Done.
```
