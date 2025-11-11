/**
 * Script to synchronize rulebook-complete.json from individual category JSON files
 * 
 * Usage: npx tsx scripts/sync-rulebook.ts
 * 
 * This script:
 * 1. Reads all category JSON files (podstawy.json, cechy-i-umiejetnosci.json, etc.)
 * 2. Aggregates all sections and categories
 * 3. Builds navigation structure
 * 4. Generates rulebook-complete.json
 */

import fs from 'fs';
import path from 'path';

// Configuration
const RULEBOOK_DIR = path.join(process.cwd(), 'public/data/rulebook');
const OUTPUT_FILE = path.join(RULEBOOK_DIR, 'rulebook-complete.json');

const CATEGORY_IDS = [
  'podstawy',
  'cechy-i-umiejetnosci', 
  'system-walki',
  'magia-i-zaklecia',
  'zdrowie-i-regeneracja'
];

// Types
interface RulebookCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  slug: string;
}

interface RulebookSection {
  id: string;
  slug: string;
  title: string;
  category: string;
  order: number;
  content: unknown[];
  subsections: unknown[];
  description?: string;
  lastModified?: string;
}

interface NavigationNode {
  id: string;
  title: string;
  slug: string;
  category: string;
  order: number;
  children?: NavigationChild[];
}

interface NavigationChild {
  id: string;
  title: string;
  slug: string;
  category: string;
  order: number;
}

interface CategoryData {
  category: RulebookCategory;
  sections: RulebookSection[];
}

interface RulebookComplete {
  categories: RulebookCategory[];
  sections: RulebookSection[];
  navigation: NavigationNode[];
  version: string;
  lastUpdated: string;
}

/**
 * Build navigation structure from categories and sections
 */
function buildNavigation(
  categories: RulebookCategory[], 
  sections: RulebookSection[]
): NavigationNode[] {
  return categories
    .sort((a, b) => a.order - b.order)
    .map(category => {
      const categorySections = sections
        .filter(s => s.category === category.id)
        .sort((a, b) => a.order - b.order);

      return {
        id: category.id,
        title: category.title,
        slug: category.slug,
        category: category.id,
        order: category.order,
        children: categorySections.map(section => ({
          id: section.id,
          title: section.title,
          slug: `${category.slug}/${section.slug}`,
          category: category.id,
          order: section.order
        }))
      };
    });
}

/**
 * Main synchronization function
 */
function syncRulebook(): void {
  console.log('🔄 Starting rulebook synchronization...\n');

  const allSections: RulebookSection[] = [];
  const allCategories: RulebookCategory[] = [];

  // Read all category files
  for (const categoryId of CATEGORY_IDS) {
    const filePath = path.join(RULEBOOK_DIR, `${categoryId}.json`);
    
    console.log(`📖 Reading: ${categoryId}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: File not found - ${filePath}`);
      process.exit(1);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data: CategoryData = JSON.parse(fileContent);

      allCategories.push(data.category);
      allSections.push(...data.sections);

      console.log(`   ✅ Loaded ${data.sections.length} sections from ${categoryId}`);
    } catch (error) {
      console.error(`❌ Error parsing ${filePath}:`, error);
      process.exit(1);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Categories: ${allCategories.length}`);
  console.log(`   - Sections: ${allSections.length}`);

  // Build complete rulebook object
  const complete: RulebookComplete = {
    categories: allCategories.sort((a, b) => a.order - b.order),
    sections: allSections,
    navigation: buildNavigation(allCategories, allSections),
    version: '1.0',
    lastUpdated: new Date().toISOString()
  };

  // Write to rulebook-complete.json
  console.log(`\n💾 Writing to: rulebook-complete.json`);
  
  try {
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(complete, null, 2),
      'utf-8'
    );
    console.log(`✅ Successfully generated rulebook-complete.json`);
    console.log(`   - File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
    console.log(`   - Last updated: ${complete.lastUpdated}`);
  } catch (error) {
    console.error(`❌ Error writing file:`, error);
    process.exit(1);
  }

  console.log('\n✨ Synchronization complete!');
}

// Run the script
try {
  syncRulebook();
} catch (error) {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}
