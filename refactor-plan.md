# Frontend Refactor Plan - Character Sheet Application
**Date:** December 4, 2025  
**Focus:** Reusability, Readability, Maintainability

## Executive Summary

This document outlines a comprehensive refactoring strategy for the Character Sheet application. The primary goals are to enhance code reusability, improve readability, and increase long-term maintainability without compromising application performance.

**Current State Assessment:**
- Well-structured Next.js 16 application with React Server Components
- Good separation of concerns (domain, application, infrastructure, persistence)
- Some repetitive patterns in forms, components, and data fetching
- Opportunities for better abstraction and code reuse

**Expected Outcomes:**
- 30-40% reduction in code duplication
- Improved developer experience and onboarding
- Easier maintenance and feature additions
- Better consistency across the application

---

## 1. Component Architecture Improvements

### 1.1 Sheet/Modal Component Abstraction

**Problem:** Repetitive sheet/modal patterns for editing entities (e.g., `PerkableEditSheet`, `ItemEditSheet`, `RaceEditSheet`).

**Current Pattern:**
```tsx
// Repeated in multiple files
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size='icon'>{editIcon}</Button>
  </SheetTrigger>
  <SheetContent className="w-full">
    <SheetHeader>
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{displayedText.clickSave}</SheetDescription>
    </SheetHeader>
    <div className="flex flex-col gap-3 px-4">
      {/* Entity-specific fields */}
    </div>
    <SheetFooter>
      <SubmitButton isPending={isPending} formName={formId} />
      <SheetClose asChild>
        <Button variant="outline">{displayedText.close}</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Proposed Solution:**

Create a generic `EditSheet` component:

```tsx
// src/common/components/sheets/EditSheet.tsx
interface EditSheetProps {
  title: string;
  description?: string;
  isPending: boolean;
  formId: string;
  triggerVariant?: ButtonVariant;
  triggerIcon?: React.ReactNode;
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function EditSheet({
  title,
  description = displayedText.clickSave,
  isPending,
  formId,
  triggerVariant = "outline",
  triggerIcon = editIcon,
  children,
  onOpenChange
}: EditSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant={triggerVariant} size="icon">
          {triggerIcon}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full">
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          {children}
        </div>
        <SheetFooter>
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type="button">
              {displayedText.close}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

**Usage:**
```tsx
<EditSheet
  title={displayedText.editPerk}
  isPending={isPending}
  formId={formId}
>
  <PerkEditableFields />
  {additionalFields}
</EditSheet>
```

**Benefits:**
- Eliminates duplication across 10+ edit sheet components
- Consistent UX across all edit operations
- Single place to update sheet behavior
- Easier to add features (e.g., unsaved changes warning)

---

### 1.2 Card Component Standardization

**Problem:** Inconsistent card patterns for displaying and editing data.

**Proposed Solution:**

Create specialized card variants:

```tsx
// src/common/components/cards/DataCard.tsx
interface DataCardProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "muted" | "primary";
  children: React.ReactNode;
}

export function DataCard({ title, icon, actions, variant = "default", children }: DataCardProps) {
  return (
    <Card className={cn(variantStyles[variant])}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// src/common/components/cards/EditableCard.tsx
interface EditableCardProps extends DataCardProps {
  onAdd?: () => void;
  addLabel?: string;
}

export function EditableCard({ onAdd, addLabel, ...cardProps }: EditableCardProps) {
  const actions = onAdd ? (
    <Button onClick={onAdd} variant="ghost" size="sm">
      {addIcon} {addLabel}
    </Button>
  ) : cardProps.actions;

  return <DataCard {...cardProps} actions={actions} />;
}
```

**Benefits:**
- Consistent card styling across application
- Easier to implement new features
- Reduced boilerplate in component files
