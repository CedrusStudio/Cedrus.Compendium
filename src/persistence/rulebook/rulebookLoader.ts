/**
 * Server-side data loader for rulebook content
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  RulebookData,
  RulebookSection,
  RulebookCategory,
  NavigationNode,
  RulebookCategoryId
} from '@/domain/rulebook/RulebookTypes';
import { RULEBOOK_CATEGORIES } from '@/domain/rulebook/constants';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'rulebook');

/**
 * Load complete rulebook data
 */
export function loadRulebookData(): RulebookData {
  const filePath = path.join(DATA_DIR, 'rulebook-complete.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as RulebookData;
}

/**
 * Load sections for a specific category
 */
export function loadCategorySections(categoryId: RulebookCategoryId): RulebookSection[] {
  const filePath = path.join(DATA_DIR, `${categoryId}.json`);
  const data = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(data);
  return parsed.sections as RulebookSection[];
}

/**
 * Load a specific section by category and slug
 */
export function loadSection(categoryId: RulebookCategoryId, slug: string): RulebookSection | null {
  const sections = loadCategorySections(categoryId);
  return sections.find(s => s.slug === slug) || null;
}

/**
 * Get all sections across all categories
 */
export function loadAllSections(): RulebookSection[] {
  const data = loadRulebookData();
  return data.sections;
}

/**
 * Get navigation tree
 */
export function loadNavigation(): NavigationNode[] {
  const data = loadRulebookData();
  return data.navigation;
}

/**
 * Get all categories
 */
export function loadCategories(): RulebookCategory[] {
  return RULEBOOK_CATEGORIES;
}

/**
 * Get category by ID
 */
export function loadCategory(categoryId: RulebookCategoryId): RulebookCategory | null {
  return RULEBOOK_CATEGORIES.find(c => c.id === categoryId) || null;
}

/**
 * Search sections by text
 */
export function searchSections(query: string, categoryId?: RulebookCategoryId): RulebookSection[] {
  const allSections = categoryId ? loadCategorySections(categoryId) : loadAllSections();
  const lowerQuery = query.toLowerCase();

  return allSections.filter(section => {
    // Search in title
    if (section.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in content blocks
    const contentText = section.content
      .map(block => {
        if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'blockquote') {
          return block.content;
        }
        if (block.type === 'list') {
          return block.items.join(' ');
        }
        if (block.type === 'table') {
          return block.table.headers.join(' ') + ' ' + block.table.rows.flat().join(' ');
        }
        return '';
      })
      .join(' ')
      .toLowerCase();

    return contentText.includes(lowerQuery);
  });
}

/**
 * Get sections by tag
 */
export function loadSectionsByTag(tag: string): RulebookSection[] {
  const allSections = loadAllSections();
  return allSections.filter(s => s.tags?.includes(tag));
}

/**
 * Get table of contents for a section
 */
export function getSectionTableOfContents(section: RulebookSection): Array<{ title: string; anchor: string; level: number }> {
  const toc: Array<{ title: string; anchor: string; level: number }> = [];

  section.subsections.forEach(subsection => {
    toc.push({
      title: subsection.title,
      anchor: subsection.anchor,
      level: 2
    });

    // Add H3 headings from subsection content
    subsection.content.forEach(block => {
      if (block.type === 'heading' && block.level >= 3) {
        toc.push({
          title: block.content,
          anchor: block.anchor,
          level: block.level
        });
      }
    });
  });

  return toc;
}
