"use client";

/**
 * UI-side plugin registry for analyzer tabs. Kept separate from the domain
 * registry because analyzers carry React components and must never reach a Web
 * Worker. Only the main thread loads these.
 */

import type { ComponentType } from "react";

export type AnalyzerPlugin =
{
  id: string;
  label: string;
  component: ComponentType;
};

const analyzers: AnalyzerPlugin[] = [];

export function registerAnalyzer(plugin: AnalyzerPlugin): void
{
  if (analyzers.some(a => a.id === plugin.id)) return;
  analyzers.push(plugin);
}

export function pluginAnalyzers(): AnalyzerPlugin[]
{
  return [...analyzers];
}
