/**
 * Component for rendering different types of content blocks
 */

import type { ContentBlock } from '@/domain/rulebook/RulebookTypes';
import { RulebookTable } from './RulebookTable';
import { parseInlineMarkdown } from './utils/markdownParser';

type ContentBlockRendererProps = {
  block: ContentBlock;
};

export function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'heading':
      const HeadingTag = `h${block.level}` as const;
      return (
        <HeadingTag
          id={block.anchor}
          className={`
            scroll-mt-20
            ${block.level === 2 ? 'text-2xl font-bold mt-6 mb-4' : ''}
            ${block.level === 3 ? 'text-xl font-semibold mt-5 mb-3' : ''}
            ${block.level === 4 ? 'text-lg font-semibold mt-4 mb-2' : ''}
            ${block.level === 5 ? 'text-base font-semibold mt-3 mb-2' : ''}
            ${block.level === 6 ? 'text-sm font-semibold mt-2 mb-1' : ''}
          `}
        >
          {parseInlineMarkdown(block.content)}
        </HeadingTag>
      );

    case 'paragraph':
      return (
        <p className="mb-3 leading-relaxed text-muted-foreground">
          {parseInlineMarkdown(block.content)}
        </p>
      );

    case 'table':
      return (
        <div className="my-4">
          <RulebookTable table={block.table} />
        </div>
      );

    case 'list':
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag className={`mb-3 ml-6 space-y-1.5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item, idx) => (
            <li key={idx} className="text-muted-foreground leading-relaxed">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ListTag>
      );

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic bg-muted/50 rounded-r">
          <p className="text-muted-foreground">{parseInlineMarkdown(block.content)}</p>
        </blockquote>
      );

    case 'code':
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
          <code className="text-sm font-mono">{block.content}</code>
        </pre>
      );

    default:
      return null;
  }
}
