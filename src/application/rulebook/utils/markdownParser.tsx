/**
 * Parse inline Markdown formatting in text
 * Handles: **bold**, *italic*, backslash escapes
 */

import React from 'react';

export function parseInlineMarkdown(text: string): React.ReactNode 
{
  if (!text) return text;
  
  // Remove backslashes before numbers (e.g., \1. → 1.)
  text = text.replace(/\\(\d+)\./g, '$1.');
  
  // Remove other common backslash escapes
  text = text.replace(/\\([*_#\[\]()\\])/g, '$1');
  
  // First pass: handle **bold** (must be done before *italic* to avoid conflicts)
  const boldRegex = /\*\*(.+?)\*\*/g;
  const parts: (string | { type: 'bold' | 'italic'; content: string })[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) 
  {
    if (match.index > lastIndex) 
    {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: 'bold', content: match[1] });
    lastIndex = boldRegex.lastIndex;
  }
  
  if (lastIndex < text.length) 
  {
    parts.push(text.slice(lastIndex));
  }
  
  // Second pass: handle *italic* in remaining text parts
  const finalParts: (string | { type: 'bold' | 'italic'; content: string })[] = [];
  
  for (const part of parts) 
  {
    if (typeof part === 'string') 
    {
      const italicRegex = /\*(.+?)\*/g;
      let italicLastIndex = 0;
      let italicMatch;
      
      while ((italicMatch = italicRegex.exec(part)) !== null) 
      {
        if (italicMatch.index > italicLastIndex) 
        {
          finalParts.push(part.slice(italicLastIndex, italicMatch.index));
        }
        finalParts.push({ type: 'italic', content: italicMatch[1] });
        italicLastIndex = italicRegex.lastIndex;
      }
      
      if (italicLastIndex < part.length) 
      {
        finalParts.push(part.slice(italicLastIndex));
      }
    } 
    else 
    {
      finalParts.push(part);
    }
  }
  
  // Convert to React elements
  if (finalParts.length === 0) return text;
  
  return (
    <>
      {finalParts.map((part, index) => {
        if (typeof part === 'string') 
        {
          return part;
        } 
        else if (part.type === 'bold') 
        {
          return <strong key={index}>{part.content}</strong>;
        } 
        else if (part.type === 'italic') 
        {
          return <em key={index}>{part.content}</em>;
        }
        return null;
      })}
    </>
  );
}


