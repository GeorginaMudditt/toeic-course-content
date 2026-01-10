# Resource Print Layout Optimization

This document explains the automatic print layout optimization system for HTML resources.

## Overview

The system automatically optimizes print layout so that:
- Each section (defined by h2/h3 headings) stays together on one page
- As many sections as possible fit on each page
- White space is minimized
- Manual page breaks are only needed for the Answers section

## CSS Template

Use this CSS template in all resource HTML files:

```css
<style>
  /* General spacing for online viewing - more space above sections/headings */
  .section {
    margin-top: 24px;
    margin-bottom: 12px;
  }
  .section:first-child {
    margin-top: 0;
  }
  /* Headings inside sections get less margin since section already has spacing */
  .section h2, .section h3 {
    margin-top: 0;
    margin-bottom: 8px;
  }
  /* Headings outside sections (like main title or answers) get full spacing */
  h2:first-of-type, h3:first-of-type {
    margin-top: 0;
  }
  
  @media print {
    @page { 
      margin: 1.5cm; 
      size: A4;
    }
    body { 
      margin: 0; 
      padding: 0; 
      orphans: 3;
      widows: 3;
    }
    /* Manual page breaks - use sparingly (e.g., for Answers section) */
    .page-break { page-break-before: always; }
    
    /* Sections: Each div containing an h2 or h3 + its content should stay together */
    .section {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 12px;
      margin-top: 0; /* Reduce top margin for print to save space */
    }
    
    /* Legacy classes for backward compatibility */
    .no-break { page-break-inside: avoid; break-inside: avoid; }
    .keep-together { 
      page-break-inside: avoid; 
      break-inside: avoid;
    }
    
    /* Headings should not be orphaned at bottom of page */
    h1, h2, h3 { 
      page-break-after: avoid; 
      break-after: avoid;
      orphans: 3;
      widows: 3;
    }
    
    /* Keep tables, lists together */
    table, ul, ol { 
      page-break-inside: avoid; 
      break-inside: avoid; 
    }
    
    /* Optimize spacing for print - headings get less top margin */
    .section h2, .section h3 {
      margin-top: 0;
      margin-bottom: 4px;
    }
  }
</style>
```

## HTML Structure

### Standard Structure

1. **Main Container**: Wrap all content (except Answers) in one main container div:
   ```html
   <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.4; color: #333;">
   ```

2. **Each Section**: Wrap each heading + its content in a div with class `section`:
   ```html
   <div class="section">
     <h2>Section Title</h2>
     <!-- Section content -->
   </div>
   ```

3. **Answers Section**: Use a separate container with class `page-break`:
   ```html
   <!-- Answers Section - Keep on separate page -->
   <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.4; color: #333;" class="page-break">
     <h2>📝 Answers</h2>
     <!-- Answers content -->
   </div>
   ```

## How It Works

1. **`.section` class**: Each section (heading + content) has `page-break-inside: avoid`, meaning it cannot be split across pages. The browser will move the entire section to the next page if it doesn't fit.

2. **Automatic Flow**: Sections flow naturally. The browser automatically fits as many complete sections as possible on each page.

3. **Orphans/Widows**: The `orphans: 3` and `widows: 3` CSS properties ensure at least 3 lines of text stay together, preventing awkward breaks.

4. **No Manual Page Breaks**: Don't use manual page breaks (`.page-break`) between content sections. Only use it before the Answers section.

## Benefits

- **Automatic**: Works for all resources without manual tweaking
- **Optimized**: Fits maximum content per page while keeping sections together
- **Maintainable**: Easy to apply to new resources
- **Consistent**: Same behavior across all resources

## Example

```html
<div style="max-width: 800px; margin: 0 auto; padding: 20px; ...">
  
  <!-- Section 1 -->
  <div class="section">
    <h2>Vocabulary Focus #1</h2>
    <p>Content...</p>
    <table>...</table>
  </div>

  <!-- Section 2 -->
  <div class="section">
    <h2>Grammar Focus #1</h2>
    <p>Content...</p>
  </div>

  <!-- Section 3 -->
  <div class="section">
    <h2>Practice #1</h2>
    <p>Content...</p>
  </div>

</div>

<!-- Answers - Separate page -->
<div style="max-width: 800px; margin: 0 auto; padding: 20px; ..." class="page-break">
  <h2>📝 Answers</h2>
  <!-- Answers -->
</div>
```

## Notes

- The browser will automatically determine page breaks based on section size
- Large sections (like large tables) will automatically start on a new page if needed
- Multiple smaller sections will flow together naturally
- Only use `.page-break` when absolutely necessary (Answers section)
