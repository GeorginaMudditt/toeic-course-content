# Resource Update Commands

After updating HTML files in the `resources/` folder, run the command below to push changes to the **Supabase** database. The script reads credentials from `.env.local`—no need to fetch env vars each time if you do the one-time setup below.

## Update All Resources at Once

```bash
./update-all-resources.sh
```

This updates all HTML resources (grammar, vocabulary, speaking, tests) in one go.

### One-time setup so the live site gets the updates

The live site uses the **Supabase project configured in Netlify’s environment variables**. Do this once: in **Netlify** → your site → **Environment variables**, copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and put them in your project's `.env.local` (next to `package.json`). After that, every time you (or the assistant) run `./update-all-resources.sh`, it updates the production database and the live site. No need to look up env vars again.

## Update Individual Resources

```bash
npm run update:resource:supabase "Resource Title" [html-file-name]
```

Examples:

```bash
npm run update:resource:supabase "Adjectives"
npm run update:resource:supabase "Modal Verbs" "modal-verbs-html.html"
```

If the filename doesn't match the default pattern, pass it as the second argument.

## When Adding a New Resource

**Important:** Every new HTML resource must be added to `update-all-resources.sh` so it gets updated when you run the batch script.

1. Create the HTML file in `resources/` (e.g. `my-new-worksheet-html.html`)
2. Create the resource in the web interface (Teacher → Resources)
3. **Add the resource to `update-all-resources.sh`** — add a new line:
   ```bash
   npm run update:resource:supabase "Exact Resource Title" "my-new-worksheet-html.html"
   ```
4. Run `./update-all-resources.sh` to push the content to the database

The script has a reminder comment at the top — always add new grammar worksheets to the list.

## Notes

- The script matches resources by title (case-insensitive, partial match)
- Make sure the resource title in the database matches what you use in the command
- If a resource is not found, the script will list available resources
