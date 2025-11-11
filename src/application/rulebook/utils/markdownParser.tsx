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
  
  // Split by bold markers (**text**)
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  
  return parts.map((part, index) => 
  {
    // Bold text
    if (part.startsWith('**') && part.endsWith('**')) 
    {
      const boldContent = part.slice(2, -2);
      return <strong key={index}>{boldContent}</strong>;
    }
    
    // Check for italic (single asterisk *text*)
    if (part.includes('*')) 
    {
      const italicParts = part.split(/(\*[^*]+?\*)/g);
      
      return (
        <React.Fragment key={index}>
          {italicParts.map((iPart, iIndex) => {
            if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
              return <em key={`${index}-${iIndex}`}>{iPart.slice(1, -1)}</em>;
            }
            return iPart;
          })}
        </React.Fragment>
      );
    }
    
    return part;
  });
}
