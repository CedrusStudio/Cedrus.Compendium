"use client";

/** Trigger a browser download of a CSV string. */
export function downloadCsv(filename: string, csv: string): void
{
  // BOM so Excel opens UTF-8 (Polish characters) correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
