# Resource Creation Workflow

This guide explains how to create and update resources with print/PDF-friendly formatting.

## Two Ways to Create Resources

### Option 1: Upload PDF/Image Files
Perfect if you already have resources as PDFs or images!

1. **Create the resource in the web interface** (Teacher → Resources → New Resource)
   - Fill in title, description, type, level, etc.
   - Select "Upload PDF/Image" option
   - Upload your PDF or image file (PNG, JPEG)
   - Click "Create Resource"

That's it! The file will be stored and students can view/download it.

### Option 2: HTML Content (with direct updates)
For creating resources from scratch or editing HTML directly:

1. **Create the resource in the web interface** (Teacher → Resources → New Resource)
   - Fill in title, description, type, level, etc.
   - Select "HTML Content" option
   - You can leave the content field empty for now

2. **Create your HTML file** in the `resources/` folder
   - Copy `template-html.html` as a starting point
   - Name it something like `my-resource-html.html`

3. **Edit your HTML** with your content

4. **Update the resource in the database**:
   ```bash
   npm run update:resource "Your Resource Name"
   ```

## Template Features

The `template-html.html` file includes:

- ✅ **Print/PDF-friendly styles** - Automatically formats for 2-page printing
- ✅ **Page break controls** - Prevents awkward page breaks
- ✅ **Brizzle branding** - Logo and styling included
- ✅ **Numbered lists** - Properly formatted for exercises and answers

## CSS Classes Available

- `page-break` - Force a new page (use on page 2 div)
- `no-break` - Prevent content from breaking across pages
- `keep-together` - Keep related content together (e.g., heading + content)

## Font Sizes & Spacing Guidelines

For optimal 2-page printing:

- **Title**: 24px
- **Section headings (h2)**: 18px
- **Sub-headings (h3)**: 16px
- **Body text**: 13-14px
- **Table text**: 12px
- **Margins**: 8-10px between sections
- **List items**: 6-10px spacing

## Examples

### Update Modal Verbs resource:
```bash
npm run update:resource "Modal Verbs"
```

### Update with custom filename:
```bash
npm run update:resource "My Resource" "custom-file.html"
```

## Tips

1. **Always keep the `<style>` section** at the top - it contains all the print-friendly CSS
2. **Use numbered lists** (`<ol>`) for exercises and answers - they automatically display numbers
3. **Test the PDF** - Use the "View" button in Resource Bank to preview and download PDF
4. **Keep content compact** - Smaller fonts and spacing help fit on 2 pages

## File Structure

```
resources/
  ├── template-html.html          # Template for new resources
  ├── modal-verbs-html.html       # Example: Modal Verbs resource
  └── your-resource-html.html     # Your new resources
```

