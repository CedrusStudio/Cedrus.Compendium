"use client";

import * as React from "react";

type TransitionProps = React.PropsWithChildren<{ name: string; share: string; enter?: string; default: string }>;

// Next's App Router ships ViewTransition. Standalone React 19.2 renderers use the same heading directly.
const Transition = "ViewTransition" in React
  ? React.ViewTransition as React.ComponentType<TransitionProps>
  : undefined;

export default function CharacterTitleTransition({ id, detail, children }: React.PropsWithChildren<{ id: string; detail?: boolean }>)
{
  return Transition
    ? <Transition name={`character-${id}`} share="character-title" enter={detail ? "character-title" : "none"} default="none">{children}</Transition>
    : children;
}
