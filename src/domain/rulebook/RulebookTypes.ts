/**
 * Core types for Cedrus Rulebook system
 */

/**
 * Represents a single table cell
 */
export interface TableCell {
  content: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Represents a table in the rulebook
 */
export interface RulebookTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

/**
 * Represents different types of content blocks
 */
export type ContentBlockType = 
  | 'paragraph'
  | 'heading'
  | 'table'
  | 'list'
  | 'blockquote'
  | 'code';

/**
 * Base content block interface
 */
export interface BaseContentBlock {
  type: ContentBlockType;
  id: string;
}

/**
 * Paragraph content block
 */
export interface ParagraphBlock extends BaseContentBlock {
  type: 'paragraph';
  content: string;
}

/**
 * Heading content block
 */
export interface HeadingBlock extends BaseContentBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
  anchor: string; // URL-friendly anchor
}

/**
 * Table content block
 */
export interface TableBlock extends BaseContentBlock {
  type: 'table';
  table: RulebookTable;
}

/**
 * List content block
 */
export interface ListBlock extends BaseContentBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

/**
 * Blockquote content block
 */
export interface BlockquoteBlock extends BaseContentBlock {
  type: 'blockquote';
  content: string;
}

/**
 * Code block
 */
export interface CodeBlock extends BaseContentBlock {
  type: 'code';
  language?: string;
  content: string;
}

/**
 * Union type for all content blocks
 */
export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | TableBlock
  | ListBlock
  | BlockquoteBlock
  | CodeBlock;

/**
 * Represents a subsection within a rulebook section
 */
export interface RulebookSubsection {
  id: string;
  title: string;
  anchor: string;
  content: ContentBlock[];
}

/**
 * Represents a complete rulebook section (one markdown file)
 */
export interface RulebookSection {
  id: string;
  slug: string;
  title: string;
  category: RulebookCategoryId;
  order: number;
  description?: string;
  content: ContentBlock[];
  subsections: RulebookSubsection[];
  tags?: string[];
  lastModified?: string;
}

/**
 * Category IDs matching the folder structure
 */
export type RulebookCategoryId =
  | 'podstawy'
  | 'cechy-i-umiejetnosci'
  | 'system-walki'
  | 'magia-i-zaklecia'
  | 'zdrowie-i-regeneracja';

/**
 * Category display information
 */
export interface RulebookCategory {
  id: RulebookCategoryId;
  title: string;
  description: string;
  icon: string;
  order: number;
  slug: string;
}

/**
 * Navigation tree node for sidebar
 */
export interface NavigationNode {
  id: string;
  title: string;
  slug: string;
  category: RulebookCategoryId;
  children?: NavigationNode[];
  order: number;
}

/**
 * Search result item
 */
export interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  category: RulebookCategoryId;
  slug: string;
  excerpt: string;
  relevance: number;
}

/**
 * Complete rulebook data structure
 */
export interface RulebookData {
  categories: RulebookCategory[];
  sections: RulebookSection[];
  navigation: NavigationNode[];
  version: string;
  lastUpdated: string;
}

/**
 * Metadata for the entire rulebook
 */
export interface RulebookMetadata {
  totalSections: number;
  totalCategories: number;
  version: string;
  lastUpdated: string;
  author: string;
  system: string;
}
