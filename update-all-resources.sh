#!/bin/bash

# Script to update all grammar worksheet HTML resources in the database
# Run this after updating HTML files to push changes to the database
#
# ⚠️  WHEN ADDING A NEW GRAMMAR WORKSHEET: Add it to this list!
#      Each new grammar worksheet must be added here so it gets updated
#      when running ./update-all-resources.sh
#      See RESOURCE_UPDATE_COMMANDS.md for the full workflow.

echo "🔄 Updating all grammar worksheet resources in the database..."
echo ""

# Grammar worksheets (alphabetical by title)
npm run update:resource:supabase "Adjectives" "adjectives-html.html"
npm run update:resource:supabase "Comparative and Superlative Adjectives" "comparative-and-superlative-adjectives-html.html"
npm run update:resource:supabase "Conditionals: Zero, First, Second" "conditionals-zero-first-second-html.html"
npm run update:resource:supabase "Conditionals: Third, Mixed" "conditionals-third-mixed-html.html"
npm run update:resource:supabase "Modal Verbs" "modal-verbs-html.html"
npm run update:resource:supabase "Mixed Tense Review" "mixed-tense-review-html.html"
npm run update:resource:supabase "Passive Voice 1" "passive-voice-1-html.html"
npm run update:resource:supabase "Passive Voice 2" "passive-voice-2-html.html"
npm run update:resource:supabase "Past Continuous" "past-continuous-html.html"
npm run update:resource:supabase "Past Perfect: Simple and Continuous" "past-perfect-simple-and-continuous-html.html"
npm run update:resource:supabase "Past Simple" "past-simple-html.html"
npm run update:resource:supabase "Past Simple and Past Continuous" "past-simple-and-past-continuous-html.html"
npm run update:resource:supabase "Present Continuous" "present-continuous-html.html"
npm run update:resource:supabase "Present Perfect Continuous" "present-perfect-continuous-html.html"
npm run update:resource:supabase "Present Perfect Simple" "present-perfect-simple-html.html"
npm run update:resource:supabase "Present Simple: other verbs" "present-simple-other-verbs-html.html"
npm run update:resource:supabase 'Present Simple: the verb "to be"' "present-simple-the-verb-to-be-html.html"
npm run update:resource:supabase "Relative Clauses" "relative-clauses-html.html"
npm run update:resource:supabase "Reported Speech" "reported-speech-html.html"
npm run update:resource:supabase "Used to and Be used to" "used-to-and-be-used-to-html.html"

echo ""
echo "✅ All grammar worksheet resources updated!"
