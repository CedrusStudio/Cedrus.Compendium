import { PropsWithChildren, Suspense } from "react";
import "./sheet.css";

/**
 * Print route group: no navbar, no breadcrumbs, no app chrome.
 *
 * It still nests inside the root layout (and therefore inside `Providers`,
 * which the character query needs) — the only things stripped are the
 * character-area navigation and padding.
 */
export const dynamic = 'force-dynamic';

export default function PrintLayout({ children }: PropsWithChildren)
{
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
};
