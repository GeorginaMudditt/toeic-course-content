# Resource Update Commands

After updating HTML files in the `resources/` folder, run these commands to update the resources in the database.

## Update All Grammar Worksheets at Once

```bash
./update-all-resources.sh
```

This updates all 20 grammar worksheets in one go.

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

## When Adding a New Grammar Worksheet

**Important:** Every new grammar worksheet must be added to `update-all-resources.sh` so it gets updated when you run the batch script.

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
