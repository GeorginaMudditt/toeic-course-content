#!/bin/bash

# Script to update all HTML resources in the database
# Run this after updating HTML files to push changes to the database

echo "🔄 Updating all resources in the database..."
echo ""

# Update each resource
npm run update:resource:supabase "Adjectives"
npm run update:resource:supabase "Comparative and Superlative Adjectives"
npm run update:resource:supabase "Past Simple & Past Continuous"
npm run update:resource:supabase "Past Perfect"
npm run update:resource:supabase "Used to & Be used to"
npm run update:resource:supabase "Passive Voice 1"

echo ""
echo "✅ All resources updated!"
