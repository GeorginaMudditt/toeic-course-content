# Resource Update Commands

After updating HTML files in the `resources/` folder, run these commands to update the resources in the database:

## Update Individual Resources

```bash
npm run update:resource:supabase "Adjectives"
npm run update:resource:supabase "Comparative and Superlative Adjectives"
npm run update:resource:supabase "Past Simple & Past Continuous"
npm run update:resource:supabase "Past Perfect"
npm run update:resource:supabase "Used to & Be used to"
npm run update:resource:supabase "Passive Voice 1"
```

## Update All Resources at Once

You can run the provided script:

```bash
./update-all-resources.sh
```

Or run all commands manually in sequence.

## Notes

- The script matches resources by title (case-insensitive, partial match)
- Make sure the HTML file names match the expected pattern: `{resource-name-lowercase}-html.html`
- If a resource is not found, the script will list available resources
