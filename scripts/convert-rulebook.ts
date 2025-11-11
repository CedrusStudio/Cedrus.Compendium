/**
 * Script to convert Markdown files from rulebook-data/ to structured JSON
 * Run with: npx ts-node scripts/convert-rulebook.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  RulebookSection,
  RulebookData,
  ContentBlock,
  RulebookSubsection,
  RulebookTable,
  HeadingBlock,
  ParagraphBlock,
  TableBlock,
  ListBlock,
  BlockquoteBlock,
  NavigationNode
} from '../src/domain/rulebook/RulebookTypes';
import { RULEBOOK_CATEGORIES, FOLDER_TO_CATEGORY } from '../src/domain/rulebook/constants';

// Paths
const RULEBOOK_DATA_DIR = path.join(__dirname, '../rulebook-data');
const OUTPUT_DIR = path.join(__dirname, '../public/data/rulebook');

/**
 * Generate a URL-friendly slug from a string
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique ID
 */
function generateId(prefix: string, text: string): string {
  return `${prefix}-${slugify(text)}`;
}

/**
 * Parse a markdown table
 */
function parseTable(lines: string[]): RulebookTable | null {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const separatorLine = lines[1];
  
  if (!headerLine.includes('|') || !separatorLine.includes('|')) return null;

  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0);

  const rows: string[][] = [];
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('|')) break;
    
    const cells = line
      .split('|')
      .map(c => c.trim())
      .filter((_, idx) => idx > 0 && idx <= headers.length);
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

/**
 * Parse markdown content into structured blocks
 */
function parseMarkdownContent(markdown: string): {
  content: ContentBlock[];
  subsections: RulebookSubsection[];
} {
  const lines = markdown.split('\n');
  const content: ContentBlock[] = [];
  const subsections: RulebookSubsection[] = [];
  
  let currentSubsection: RulebookSubsection | null = null;
  let blockCounter = 0;
  let i = 0;

  function addBlock(block: ContentBlock) {
    if (currentSubsection) {
      currentSubsection.content.push(block);
    } else {
      content.push(block);
    }
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = match[2];
        const anchor = slugify(text);

        const headingBlock: HeadingBlock = {
          type: 'heading',
          id: `heading-${blockCounter++}`,
          level,
          content: text,
          anchor
        };

        // H1 is the main title, skip it
        if (level === 1) {
          i++;
          continue;
        }

        // H2 starts a new subsection
        if (level === 2) {
          if (currentSubsection) {
            subsections.push(currentSubsection);
          }
          currentSubsection = {
            id: generateId('subsection', text),
            title: text,
            anchor,
            content: []
          };
        } else {
          addBlock(headingBlock);
        }
      }
      i++;
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      
      const table = parseTable(tableLines);
      if (table) {
        const tableBlock: TableBlock = {
          type: 'table',
          id: `table-${blockCounter++}`,
          table
        };
        addBlock(tableBlock);
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().substring(1).trim());
        i++;
      }
      
      const blockquoteBlock: BlockquoteBlock = {
        type: 'blockquote',
        id: `blockquote-${blockCounter++}`,
        content: quoteLines.join('\n')
      };
      addBlock(blockquoteBlock);
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        const item = lines[i].trim().replace(/^[-*]\s+/, '');
        listItems.push(item);
        i++;
      }
      
      const listBlock: ListBlock = {
        type: 'list',
        id: `list-${blockCounter++}`,
        ordered: false,
        items: listItems
      };
      addBlock(listBlock);
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        const item = lines[i].trim().replace(/^\d+\.\s+/, '');
        listItems.push(item);
        i++;
      }
      
      const listBlock: ListBlock = {
        type: 'list',
        id: `list-${blockCounter++}`,
        ordered: true,
        items: listItems
      };
      addBlock(listBlock);
      continue;
    }

    // Regular paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().match(/^[-*]\s+/) &&
      !lines[i].trim().match(/^\d+\.\s+/)
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }

    const paragraphBlock: ParagraphBlock = {
      type: 'paragraph',
      id: `paragraph-${blockCounter++}`,
      content: paragraphLines.join(' ')
    };
    addBlock(paragraphBlock);
  }

  // Add last subsection if exists
  if (currentSubsection) {
    subsections.push(currentSubsection);
  }

  return { content, subsections };
}

/**
 * Process a single markdown file
 */
function processMarkdownFile(
  filePath: string,
  category: string,
  order: number
): RulebookSection | null {
  try {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    
    // Extract title from first H1
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : fileName;

    const slug = slugify(fileName);
    const { content, subsections } = parseMarkdownContent(markdown);

    const section: RulebookSection = {
      id: generateId('section', `${category}-${fileName}`),
      slug,
      title,
      category: category as RulebookSection['category'],
      order,
      content,
      subsections,
      lastModified: new Date().toISOString()
    };

    return section;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Recursively process a directory
 */
function processDirectory(
  dirPath: string,
  category: string,
  sections: RulebookSection[],
  baseOrder: number = 0
): number {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  let order = baseOrder;

  // First process files
  const files = items.filter(item => item.isFile() && item.name.endsWith('.md'));
  files.forEach(file => {
    const filePath = path.join(dirPath, file.name);
    const section = processMarkdownFile(filePath, category, order++);
    if (section) {
      sections.push(section);
    }
  });

  // Then process subdirectories
  const dirs = items.filter(item => item.isDirectory());
  dirs.forEach(dir => {
    const subDirPath = path.join(dirPath, dir.name);
    order = processDirectory(subDirPath, category, sections, order);
  });

  return order;
}

/**
 * Build navigation tree from sections
 */
function buildNavigationTree(sections: RulebookSection[]): NavigationNode[] {
  const tree: NavigationNode[] = [];

  RULEBOOK_CATEGORIES.forEach(category => {
    const categorySections = sections
      .filter(s => s.category === category.id)
      .sort((a, b) => a.order - b.order);

    const node: NavigationNode = {
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

    tree.push(node);
  });

  return tree;
}

/**
 * Main conversion function
 */
function convertRulebook() {
  console.log('🚀 Starting rulebook conversion...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allSections: RulebookSection[] = [];

  // Process each category folder
  Object.entries(FOLDER_TO_CATEGORY).forEach(([folderName, categoryId]) => {
    const folderPath = path.join(RULEBOOK_DATA_DIR, folderName);
    
    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️  Folder not found: ${folderPath}`);
      return;
    }

    console.log(`📁 Processing category: ${categoryId}`);
    processDirectory(folderPath, categoryId, allSections);
  });

  // Build navigation
  const navigation = buildNavigationTree(allSections);

  // Create complete rulebook data
  const rulebookData: RulebookData = {
    categories: RULEBOOK_CATEGORIES,
    sections: allSections,
    navigation,
    version: '1.0',
    lastUpdated: new Date().toISOString()
  };

  // Save complete data
  const dataPath = path.join(OUTPUT_DIR, 'rulebook-complete.json');
  fs.writeFileSync(dataPath, JSON.stringify(rulebookData, null, 2), 'utf-8');
  console.log(`\n✅ Complete data saved to: ${dataPath}`);

  // Save individual category files
  RULEBOOK_CATEGORIES.forEach(category => {
    const categorySections = allSections.filter(s => s.category === category.id);
    const categoryData = {
      category,
      sections: categorySections
    };
    
    const categoryPath = path.join(OUTPUT_DIR, `${category.id}.json`);
    fs.writeFileSync(categoryPath, JSON.stringify(categoryData, null, 2), 'utf-8');
    console.log(`✅ Category saved: ${category.title} (${categorySections.length} sections)`);
  });

  // Statistics
  console.log('\n📊 Conversion Statistics:');
  console.log(`   Total sections: ${allSections.length}`);
  console.log(`   Total categories: ${RULEBOOK_CATEGORIES.length}`);
  console.log(`   Navigation nodes: ${navigation.length}`);
  
  console.log('\n🎉 Conversion complete!\n');
}

// Run conversion
convertRulebook();
