# Frontend Refactor Plan - Character Sheet Application
**Date:** December 4, 2025  
**Focus:** Reusability, Readability, Maintainability

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Component Architecture Improvements](#component-architecture-improvements)
3. [Code Organization & Structure](#code-organization--structure)
4. [Type Safety & TypeScript Enhancements](#type-safety--typescript-enhancements)
5. [State Management Optimization](#state-management-optimization)
6. [Form Handling Standardization](#form-handling-standardization)
7. [Styling & Design System](#styling--design-system)
8. [Data Fetching & Caching](#data-fetching--caching)
9. [Testing Infrastructure](#testing-infrastructure)
10. [Documentation & Code Quality](#documentation--code-quality)
11. [Implementation Priorities](#implementation-priorities)

---

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

### 1.1 Create Shared Component Library Structure

**Problem:** Multiple similar components across the application with slight variations (e.g., `FieldView`, `FieldWithIconView`, `FieldViewWithInfo`).

**Solution:** Establish a unified component API with composition patterns.

#### 1.1.1 Unified Field Component System

**Current State:**
```tsx
// Multiple separate components
<FieldView value={10} className="...">Strength</FieldView>
<FieldWithIconView icon={icon} value={10}>Dexterity</FieldWithIconView>
<FieldViewWithInfo info="description" value={10}>Constitution</FieldViewWithInfo>
```

**Proposed Solution:**
```tsx
// Single composable Field component
<Field value={10} className="...">
  <Field.Label>Strength</Field.Label>
</Field>

<Field value={10}>
  <Field.Icon>{icon}</Field.Icon>
  <Field.Label>Dexterity</Field.Label>
</Field>

<Field value={10}>
  <Field.Label>Constitution</Field.Label>
  <Field.Info>This is a description</Field.Info>
</Field>
```

**Implementation Details:**
- Create a compound component pattern using context
- Support all existing use cases with a single API
- Allow for flexible styling through composition
- Maintain backward compatibility through wrapper components

**File Structure:**
```
src/common/components/fields/
  ├── Field.tsx              // Main compound component
  ├── FieldLabel.tsx         // Sub-component
  ├── FieldValue.tsx         // Sub-component
  ├── FieldIcon.tsx          // Sub-component
  ├── FieldInfo.tsx          // Sub-component
  ├── index.ts               // Exports
  └── __deprecated/          // Old components with deprecation warnings
      ├── FieldView.tsx
      ├── FieldWithIconView.tsx
      └── FieldViewWithInfo.tsx
```

**Benefits:**
- Reduces 3 components to 1 unified API
- More flexible and easier to extend
- Better TypeScript inference
- Clearer component composition

---

### 1.2 Sheet/Modal Component Abstraction

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

### 1.3 Card Component Standardization

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

---

## 2. Code Organization & Structure

### 2.1 Feature-Based Directory Structure

**Problem:** Current structure mixes concerns (e.g., `application/characters/edit` vs `application/characters/hooks`).

**Current Structure:**
```
src/application/characters/
  ├── add/
  ├── combat/
  ├── details/
  ├── edit/
  │   ├── combat/
  │   ├── details/
  │   ├── equipment/
  │   ├── statistics/
  │   └── talents/
  ├── equipment/
  ├── hooks/
  ├── list/
  ├── statistics/
  └── talents/
```

**Proposed Structure:**
```
src/features/characters/
  ├── api/                    // Server actions and API calls
  │   ├── useGetCharacter.ts
  │   ├── useUpdateCharacter.ts
  │   └── useDeleteCharacter.ts
  ├── components/             // All character-related components
  │   ├── CharacterView.tsx
  │   ├── CharacterList.tsx
  │   ├── CharacterNavbar.tsx
  │   └── forms/
  │       ├── CharacterDetailsForm.tsx
  │       ├── CharacterStatisticsForm.tsx
  │       ├── CharacterCombatForm.tsx
  │       └── CharacterEquipmentForm.tsx
  ├── hooks/                  // Feature-specific hooks
  │   ├── useCharacterForm.ts
  │   └── useCharacterTabs.ts
  ├── types/                  // Feature-specific types
  │   └── character.types.ts
  └── utils/                  // Feature-specific utilities
      └── characterDefaults.ts
```

**Benefits:**
- Everything related to a feature is in one place
- Easier to find and maintain code
- Better code splitting and lazy loading opportunities
- Clearer dependencies between features

---

### 2.2 Shared Utilities Organization

**Problem:** Utility functions scattered across `common/global`, making them hard to discover.

**Current State:**
```
src/common/global/
  ├── ChangeValueSideEffect.ts
  ├── httpUtils.ts
  ├── onSaveCallbacks.ts
  ├── pagination.ts
  ├── resolveSetState.ts
  ├── SearchPayloads.ts
  ├── setterUtils.ts
  └── validation.ts
```

**Proposed Structure:**
```
src/lib/
  ├── hooks/                  // Custom reusable hooks
  │   ├── useDebounce.ts
  │   ├── usePagination.ts
  │   └── useStateWithCallback.ts
  ├── http/                   // HTTP-related utilities
  │   ├── httpClient.ts
  │   ├── httpUtils.ts
  │   └── searchPayloads.ts
  ├── forms/                  // Form-related utilities
  │   ├── validation.ts
  │   ├── formCallbacks.ts
  │   └── fieldHelpers.ts
  ├── state/                  // State management utilities
  │   ├── setterUtils.ts
  │   ├── resolveSetState.ts
  │   └── stateEffects.ts
  └── utils/                  // General utilities
      ├── cn.ts
      ├── pagination.ts
      └── date.ts
```

**Implementation:**
- Create barrel exports (`index.ts`) for each category
- Update imports across codebase gradually
- Add JSDoc comments for better discoverability

---

### 2.3 Constants Management

**Problem:** Constants and configuration scattered throughout codebase.

**Proposed Solution:**

Create centralized constants files:

```typescript
// src/config/constants.ts
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  EMPTY_ULID: '00000000000000000000000000',
} as const;

export const FORM_IDS = {
  CHARACTER_DETAILS: 'character-details-form',
  CHARACTER_STATISTICS: 'character-statistics-form',
  CHARACTER_COMBAT: 'character-combat-form',
  CHARACTER_EQUIPMENT: 'character-equipment-form',
  CHARACTER_TALENTS: 'character-talents-form',
} as const;

export const CACHE_TIMES = {
  DEFAULT_STALE_TIME: 5_000,
  QUERY_STALE_TIME: 1000 * 60 * 5,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
} as const;

// src/config/queryKeys.ts
export const queryKeys = {
  characters: {
    all: ['characters'] as const,
    lists: () => [...queryKeys.characters.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.characters.lists(), { filters }] as const,
    details: () => [...queryKeys.characters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.characters.details(), id] as const,
  },
  maneuvers: {
    all: ['maneuvers'] as const,
    // ... similar pattern
  },
} as const;
```

**Benefits:**
- Single source of truth for configuration
- Type-safe constants with proper inference
- Easier to update values globally
- Better code organization

---

## 3. Type Safety & TypeScript Enhancements

### 3.1 Discriminated Union Types

**Problem:** Generic types that could be more specific.

**Current Pattern:**
```typescript
type Castable = {
  range: string;
  castTime: number;
  cooldown: number;
  // ...
}
```

**Proposed Solution:**

```typescript
// More specific types for different castable types
type InstantCastable = {
  castType: 'instant';
  castTime: 0;
  range: string;
  cooldown: number;
};

type ChanneledCastable = {
  castType: 'channeled';
  castTime: number;
  channelDuration: number;
  range: string;
  cooldown: number;
};

type RitualCastable = {
  castType: 'ritual';
  castTime: number;
  ritualComponents: string[];
  range: string;
  cooldown: number;
};

type Castable = InstantCastable | ChanneledCastable | RitualCastable;

// Type guard functions
function isInstantCast(castable: Castable): castable is InstantCastable {
  return castable.castType === 'instant';
}
```

**Benefits:**
- Better type inference in conditional logic
- Prevents invalid state combinations
- Improved autocomplete and error detection
- Self-documenting code

---

### 3.2 Strict Null Checking Patterns

**Problem:** Optional chaining used inconsistently.

**Proposed Solution:**

Create utility types and functions:

```typescript
// src/lib/types/utils.ts
export type NonNullableFields<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Helper function for safe property access
export function hasProperty<T, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && key in obj;
}

// Null-safe chaining helper
export function nullSafe<T, R>(
  value: T | null | undefined,
  accessor: (value: T) => R
): R | undefined {
  return value != null ? accessor(value) : undefined;
}
```

**Usage:**
```typescript
// Instead of:
const raceName = character?.race?.name;

// Use:
const raceName = nullSafe(character, c => c.race.name);

// Or with type guard:
if (hasProperty(character, 'race') && character.race) {
  // TypeScript knows character.race is defined here
  console.log(character.race.name);
}
```

---

### 3.3 Generic Component Props

**Problem:** Repetitive prop type definitions.

**Proposed Solution:**

```typescript
// src/lib/types/component.types.ts

// Base props that many components share
export interface BaseComponentProps {
  className?: string;
  id?: string;
}

export interface DataComponentProps<T> extends BaseComponentProps {
  data: T;
  loading?: boolean;
  error?: Error;
}

export interface EditableComponentProps<T> extends DataComponentProps<T> {
  onEdit?: (data: T) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export interface FormComponentProps<T> extends BaseComponentProps {
  defaultValues?: T;
  onSubmit: (data: T) => void | Promise<void>;
  isPending?: boolean;
  schema: ZodType<T>;
}

// Reusable generic types
export type WithChildren<T = {}> = T & { children: React.ReactNode };
export type WithOptionalChildren<T = {}> = T & { children?: React.ReactNode };
export type WithClassName<T = {}> = T & { className?: string };
```

**Benefits:**
- Consistent prop patterns across components
- Easier to add new shared props
- Better type inference
- Reduced boilerplate

---

## 4. State Management Optimization

### 4.1 Redux Slice Consolidation

**Problem:** Redux used minimally; could be replaced or better organized.

**Current Usage:**
```typescript
// Only used for storing character short names
const characterSlice = createSlice({
  name: 'character',
  initialState: {},
  reducers: {
    setCharacterShortName: (state, action) => {
      state[action.payload.id] = action.payload.shortName;
    }
  }
});
```

**Proposed Solution:**

Either:

**Option A: Use React Query exclusively**
```typescript
// Remove Redux entirely, use React Query for server state
const { data: characterNames } = useQuery({
  queryKey: ['characterNames'],
  queryFn: fetchCharacterNames,
  staleTime: Infinity, // Cache indefinitely
});
```

**Option B: Use Zustand for client state**
```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  characterNames: Record<string, string>;
  setCharacterName: (id: string, name: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Other UI state
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      characterNames: {},
      setCharacterName: (id, name) =>
        set((state) => ({
          characterNames: { ...state.characterNames, [id]: name }
        })),
      activeTab: 'character',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

**Benefits:**
- Simpler state management
- Less boilerplate
- Better TypeScript support
- Smaller bundle size

---

### 4.2 Custom Hooks for Complex State

**Problem:** State logic repeated across components.

**Proposed Solution:**

Create reusable state hooks:

```typescript
// src/lib/hooks/useToggle.ts
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
  };
}

// src/lib/hooks/useList.ts
export function useList<T>(initialList: T[] = []) {
  const [list, setList] = useState<T[]>(initialList);
  
  const add = useCallback((item: T) => {
    setList(prev => [...prev, item]);
  }, []);
  
  const remove = useCallback((index: number) => {
    setList(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const update = useCallback((index: number, item: T) => {
    setList(prev => prev.map((curr, i) => i === index ? item : curr));
  }, []);
  
  const clear = useCallback(() => setList([]), []);
  
  const replace = useCallback((newList: T[]) => setList(newList), []);
  
  return {
    list,
    add,
    remove,
    update,
    clear,
    replace,
    setList,
  };
}

// src/lib/hooks/usePagination.ts
export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [cursor, setCursor] = useState(emptyUlid);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize] = useState(initialPageSize);
  
  const reset = useCallback(() => {
    setCursor(emptyUlid);
    setHasMore(true);
  }, []);
  
  const loadMore = useCallback((lastId: string, hasMoreData: boolean) => {
    setCursor(lastId);
    setHasMore(hasMoreData);
  }, []);
  
  return {
    cursor,
    hasMore,
    pageSize,
    reset,
    loadMore,
  };
}
```

**Usage:**
```typescript
// Before
const [isOpen, setIsOpen] = useState(false);
const toggleOpen = () => setIsOpen(prev => !prev);

// After
const { value: isOpen, toggle: toggleOpen } = useToggle();

// Before
const [items, setItems] = useState<Item[]>([]);
const addItem = (item: Item) => setItems(prev => [...prev, item]);

// After
const { list: items, add: addItem } = useList<Item>();
```

---

## 5. Form Handling Standardization

### 5.1 Unified Form Hook

**Problem:** Multiple form patterns across application (`useCharacterForm`, `useFormMutation`, `EditFormForSheet`).

**Proposed Solution:**

Create a single, flexible form hook:

```typescript
// src/lib/hooks/useEntityForm.ts
interface UseEntityFormOptions<TFormData extends FieldValues> {
  schema: ZodType<TFormData>;
  defaultValues: DefaultValues<TFormData>;
  onSubmit: (data: TFormData) => Promise<void>;
  formId?: string;
  mode?: UseFormProps<TFormData>["mode"];
  invalidateKeys?: string[];
  toastPosition?: ToastPosition;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEntityForm<TFormData extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  formId = 'entity-form',
  mode = 'onBlur',
  invalidateKeys = [],
  toastPosition = 'bottom-right',
  onSuccess,
  onError,
}: UseEntityFormOptions<TFormData>) {
  const queryClient = useQueryClient();
  
  const form = useForm<TFormData>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });
  
  const { mutate, isPending } = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      if (invalidateKeys.length > 0) {
        queryClient.invalidateQueries({ queryKey: invalidateKeys });
      }
      toast.success('Saved successfully', { position: toastPosition });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Failed to save', { position: toastPosition });
      onError?.(error);
    },
  });
  
  const handleSubmit = form.handleSubmit((data) => mutate(data));
  
  return {
    form,
    handleSubmit,
    isPending,
    formId,
    // Additional helpers
    reset: form.reset,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
  };
}
```

**Usage:**
```typescript
// Unified API for all forms
const { form, handleSubmit, isPending, formId } = useEntityForm({
  schema: characterDetailsSchema,
  defaultValues: character,
  onSubmit: async (data) => await charactersClient.update(character.id, data),
  invalidateKeys: ['characters', character.id],
});
```

**Benefits:**
- Single API for all form operations
- Consistent error handling and validation
- Built-in loading states and optimistic updates
- Easier to add features (e.g., auto-save, dirty checking)

---

### 5.2 Form Field Components

**Problem:** Repetitive form field boilerplate.

**Current Pattern:**
```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{displayedText.name}</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Proposed Solution:**

Create pre-configured field components:

```tsx
// src/common/components/form/FormInput.tsx
interface FormInputProps extends InputProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormInput({ name, label, description, required, ...inputProps }: FormInputProps) {
  const { control } = useFormContext();
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel className={required ? 'required' : ''}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Input {...field} {...inputProps} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// src/common/components/form/FormTextarea.tsx
export function FormTextarea({ name, label, description, rows = 4, ...props }: FormTextareaProps) {
  const { control } = useFormContext();
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea {...field} rows={rows} {...props} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Similar components for: FormSelect, FormCheckbox, FormRadioGroup, FormSlider, etc.
```

**Usage:**
```tsx
// Before (15 lines)
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{displayedText.name}</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// After (1 line)
<FormInput name="name" label={displayedText.name} />
```

---

### 5.3 Form Array Management

**Problem:** `useFieldArray` logic repeated across components.

**Proposed Solution:**

```typescript
// src/lib/hooks/useFormArray.ts
export function useFormArray<T extends FieldValues>(name: string) {
  const { control } = useFormContext<T>();
  const { fields, append, remove, update, move } = useFieldArray({
    control,
    name,
  });
  
  // Watch the array for real-time updates
  const watchedFields = useWatch({ control, name });
  
  return {
    fields,
    items: watchedFields as any[], // Typed items
    append,
    remove,
    update,
    move,
    // Additional helpers
    clear: () => remove(),
    replace: (items: any[]) => {
      remove();
      items.forEach(item => append(item));
    },
  };
}
```

**Usage:**
```typescript
// Simplified array management
const { fields, items, append, remove } = useFormArray('weapons');
```

---

## 6. Styling & Design System

### 6.1 Theme Token System

**Problem:** Hard-coded colors and magic numbers in components.

**Current Pattern:**
```tsx
<div className="text-blue-500 bg-gray-100 p-4 rounded-lg">
```

**Proposed Solution:**

Create semantic design tokens:

```typescript
// src/config/design-tokens.ts
export const colors = {
  // Semantic colors
  primary: {
    default: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
    hover: 'hsl(var(--primary-hover))',
  },
  secondary: {
    default: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  // Contextual colors
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  error: 'hsl(var(--error))',
  info: 'hsl(var(--info))',
  // Character-specific colors
  character: {
    strength: 'text-blue-500',
    dexterity: 'text-green-500',
    constitution: 'text-red-500',
    mind: 'text-purple-500',
    charisma: 'text-pink-500',
    spellborn: 'text-cyan-500',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
} as const;
```

**Usage:**
```tsx
// Instead of hard-coded values
<div className={cn(
  'p-4',
  colors.character.strength,
  'rounded-lg'
)}>
```

---

### 6.2 Component Variants System

**Problem:** Inline className strings difficult to maintain.

**Proposed Solution:**

Use `class-variance-authority` more consistently:

```typescript
// src/common/components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        // Character-specific variants
        strength: 'border-blue-500 bg-blue-500/10 text-blue-600',
        dexterity: 'border-green-500 bg-green-500/10 text-green-600',
        constitution: 'border-red-500 bg-red-500/10 text-red-600',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
```

**Benefits:**
- Type-safe variants
- Consistent styling
- Easy to extend
- Better autocomplete

---

### 6.3 Responsive Design Utilities

**Problem:** Repetitive responsive className strings.

**Proposed Solution:**

```typescript
// src/lib/utils/responsive.ts
export const responsive = {
  // Grid systems
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  // Flex layouts
  flex: {
    col: 'flex flex-col',
    row: 'flex flex-row',
    colToRow: 'flex flex-col md:flex-row',
    rowToCol: 'flex flex-row md:flex-col',
  },
  // Common spacing
  spacing: {
    section: 'px-4 md:px-6 lg:px-8',
    container: 'container mx-auto px-4 md:px-6',
  },
  // Typography
  text: {
    heading: 'text-2xl md:text-3xl lg:text-4xl font-bold',
    subheading: 'text-lg md:text-xl lg:text-2xl font-semibold',
    body: 'text-sm md:text-base',
  },
} as const;
```

**Usage:**
```tsx
<div className={responsive.grid.cols3}>
  {/* Grid items */}
</div>
```

---

## 7. Data Fetching & Caching

### 7.1 React Query Configuration

**Problem:** Query configuration duplicated across files.

**Proposed Solution:**

Create query factories:

```typescript
// src/lib/queries/queryFactory.ts
export function createQueryFactory<TData, TParams>(
  baseKey: string[],
  fetcher: (params: TParams) => Promise<TData>,
  options?: {
    staleTime?: number;
    gcTime?: number;
  }
) {
  return {
    getKey: (params: TParams) => [...baseKey, params] as const,
    getOptions: (params: TParams) => ({
      queryKey: [...baseKey, params],
      queryFn: () => fetcher(params),
      staleTime: options?.staleTime ?? 5_000,
      gcTime: options?.gcTime ?? 1000 * 60 * 10,
    }),
  };
}

// src/features/characters/api/characterQueries.ts
export const characterQueries = {
  all: ['characters'] as const,
  
  detail: (id: string) => ({
    queryKey: [...characterQueries.all, 'detail', id],
    queryFn: () => searchClient.searchById(id, characterQueryById),
    staleTime: 5_000,
  }),
  
  list: (filters: SearchFilters) => ({
    queryKey: [...characterQueries.all, 'list', filters],
    queryFn: () => searchClient.search(createCharacterSummaryQuery(filters)),
    staleTime: 5_000,
  }),
  
  infinite: (filters: SearchFilters) => ({
    queryKey: [...characterQueries.all, 'infinite', filters],
    queryFn: ({ pageParam = emptyUlid }) =>
      searchClient.search(
        createCharacterSummaryQuery({ ...filters, cursor: pageParam })
      ),
    getNextPageParam: (lastPage: any[]) =>
      lastPage.length === filters.pageSize
        ? lastPage[lastPage.length - 1].id
        : undefined,
    staleTime: 5_000,
  }),
};
```

**Usage:**
```typescript
// In components
const { data: character } = useQuery(characterQueries.detail(id));
const { data: characters } = useQuery(characterQueries.list(filters));
```

**Benefits:**
- Centralized query configuration
- Type-safe query keys
- Easier to update caching strategy
- Better code organization

---

### 7.2 Infinite Scroll Standardization

**Problem:** Infinite scroll logic repeated in list components.

**Proposed Solution:**

```typescript
// src/lib/hooks/useInfiniteScroll.ts
export function useInfiniteScroll<TData>({
  queryKey,
  queryFn,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  queryKey: readonly unknown[];
  queryFn: (cursor: string) => Promise<TData[]>;
  pageSize?: number;
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = emptyUlid }) => queryFn(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.length === pageSize
        ? lastPage[lastPage.length - 1].id
        : undefined,
    staleTime: 5_000,
  });
  
  // Flatten pages into single array
  const items = useMemo(
    () => data?.pages.flatMap(page => page) ?? [],
    [data]
  );
  
  return {
    items,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoading: isFetchingNextPage || isLoading,
  };
}
```

**Usage:**
```typescript
// Simplified list components
const { items, loadMore, hasMore, isLoading } = useInfiniteScroll({
  queryKey: characterQueries.infinite(filters).queryKey,
  queryFn: (cursor) => searchClient.search(
    createCharacterSummaryQuery({ ...filters, cursor })
  ),
});
```

---

### 7.3 Optimistic Updates Pattern

**Problem:** Optimistic updates not used consistently.

**Proposed Solution:**

```typescript
// src/lib/mutations/mutationHelpers.ts
export function createOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  updateCache,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: readonly unknown[];
  updateCache: (oldData: TData | undefined, variables: TVariables) => TData;
}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);
      
      // Optimistically update
      queryClient.setQueryData<TData>(
        queryKey,
        (old) => updateCache(old, variables)
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

---

## 8. Testing Infrastructure

### 8.1 Testing Utilities Expansion

**Problem:** Limited testing utilities for complex scenarios.

**Proposed Solution:**

```typescript
// src/__tests__/utils/testHelpers.ts

// Mock data factories
export function createMockCharacter(overrides?: Partial<Character>): Character {
  return {
    id: ulid(),
    name: 'Test Character',
    shortName: 'Test',
    description: 'Test description',
    tags: [],
    characteristics: createDefaultCharacteristics(),
    attributes: createDefaultAttributes(),
    ...overrides,
  };
}

// Component testing helpers
export function renderWithRouterAndQuery(
  ui: React.ReactElement,
  options?: {
    route?: string;
    queryClient?: QueryClient;
  }
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options?.route ?? '/']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Form testing helpers
export async function fillFormField(
  fieldName: string,
  value: string
) {
  const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
  await userEvent.clear(field);
  await userEvent.type(field, value);
}

export async function submitForm() {
  const submitButton = screen.getByRole('button', { name: /submit|save/i });
  await userEvent.click(submitButton);
}

// Query testing helpers
export function waitForQueryToFinish() {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
}
```

---

### 8.2 Component Testing Strategy

**Proposed Approach:**

```typescript
// src/features/characters/__tests__/CharacterView.test.tsx
describe('CharacterView', () => {
  it('displays character details correctly', async () => {
    const character = createMockCharacter({
      name: 'Test Hero',
      shortName: 'Hero',
    });
    
    renderWithRouterAndQuery(<CharacterView />, {
      route: `/characters/${character.id}`,
    });
    
    await waitForQueryToFinish();
    
    expect(screen.getByText('Test Hero')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
  });
  
  it('handles tab navigation', async () => {
    const character = createMockCharacter();
    
    renderWithRouterAndQuery(<CharacterView />, {
      route: `/characters/${character.id}?tab=combat`,
    });
    
    await waitForQueryToFinish();
    
    expect(screen.getByRole('tab', { name: /combat/i })).toHaveAttribute(
      'data-state',
      'active'
    );
  });
});
```

---

## 9. Documentation & Code Quality

### 9.1 JSDoc Standards

**Proposed Standard:**

```typescript
/**
 * Custom hook for managing character forms with validation and submission
 * 
 * @template TFormData - The shape of the form data extending FieldValues
 * 
 * @param {Object} options - Configuration options for the form
 * @param {string} options.characterId - The ID of the character being edited
 * @param {ZodType<TFormData>} options.schema - Zod schema for form validation
 * @param {DefaultValues<TFormData>} options.defaultValues - Initial form values
 * @param {Function} options.updateFn - Async function to handle form submission
 * @param {string} [options.formId] - Optional form ID for external submission
 * 
 * @returns {Object} Form management utilities
 * @returns {UseFormReturn<TFormData>} return.form - React Hook Form instance
 * @returns {Function} return.handleSubmit - Form submission handler
 * @returns {boolean} return.isPending - Whether the form is currently submitting
 * @returns {string} return.formId - The form ID for external submission
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isPending } = useCharacterForm({
 *   characterId: '123',
 *   schema: detailsSchema,
 *   defaultValues: character,
 *   updateFn: updateCharacterDetails,
 * });
 * ```
 */
export function useCharacterForm<TFormData extends FieldValues>(
  options: UseCharacterFormParams<TFormData>
): UseCharacterFormReturn<TFormData> {
  // Implementation
}
```

---

### 9.2 Component Documentation

**Proposed Format:**

```tsx
/**
 * EditSheet - A reusable sheet component for editing entities
 * 
 * Provides a consistent UI for editing operations with:
 * - Edit trigger button
 * - Sheet overlay with form content
 * - Submit and cancel actions
 * - Loading states
 * 
 * @component
 * @example
 * ```tsx
 * <EditSheet
 *   title="Edit Character"
 *   isPending={false}
 *   formId="character-form"
 * >
 *   <CharacterFields />
 * </EditSheet>
 * ```
 */
export function EditSheet({
  title,
  description = displayedText.clickSave,
  isPending,
  formId,
  children,
}: EditSheetProps) {
  // Implementation
}
```

---

### 9.3 README Structure

**Proposed Project Documentation:**

```markdown
# Character Sheet Application

## Project Structure
```
src/
├── app/                    # Next.js app directory (routes)
├── features/               # Feature-based modules
│   ├── characters/        # Character management
│   ├── compendium/        # Game rules compendium
│   └── rulebook/          # Rulebook content
├── common/                # Shared components
│   ├── components/        # Reusable UI components
│   └── hooks/             # Custom React hooks
├── lib/                   # Utility libraries
│   ├── hooks/            # Reusable hooks
│   ├── utils/            # Helper functions
│   └── types/            # Shared TypeScript types
├── domain/               # Business logic
├── infrastructure/       # External integrations
└── persistence/          # Data layer
```

## Development Guidelines

### Component Creation
1. Use TypeScript for all components
2. Add JSDoc comments for public APIs
3. Export types alongside components
4. Follow naming conventions:
   - Components: PascalCase
   - Hooks: camelCase with 'use' prefix
   - Utils: camelCase
   - Types: PascalCase with descriptive suffix

### State Management
- Server state: React Query
- UI state: Zustand or local state
- Form state: React Hook Form

### Styling
- Use Tailwind CSS utilities
- Create variants with class-variance-authority
- Follow design token system

### Testing
- Unit tests for utilities
- Component tests for UI
- Integration tests for features
```

---

## 10. Implementation Priorities

### Phase 1: Foundation (Weeks 1-2)
**High Impact, Low Risk**

1. **Centralize Constants**
   - Create `src/config/` directory
   - Move all constants to centralized files
   - Update imports across codebase
   - Estimated effort: 4-6 hours

2. **Standardize Query Keys**
   - Implement query factories
   - Update React Query usage
   - Estimated effort: 8-10 hours

3. **Create Shared Hooks**
   - Implement `useToggle`, `useList`, `usePagination`
   - Refactor existing components to use them
   - Estimated effort: 6-8 hours

**Deliverables:**
- Centralized configuration
- Consistent caching strategy
- Reusable state hooks

---

### Phase 2: Component Standardization (Weeks 3-4)
**Medium Impact, Medium Risk**

1. **Unified Field Components**
   - Create compound Field component
   - Migrate existing field components
   - Estimated effort: 12-16 hours

2. **Sheet Component Consolidation**
   - Create generic EditSheet
   - Refactor all edit sheets
   - Estimated effort: 10-12 hours

3. **Form Components Library**
   - Create FormInput, FormTextarea, FormSelect, etc.
   - Update all forms to use new components
   - Estimated effort: 16-20 hours

**Deliverables:**
- Unified component API
- Reduced code duplication
- Consistent UI patterns

---

### Phase 3: Architecture Improvements (Weeks 5-6)
**High Impact, Medium Risk**

1. **Feature-Based Restructuring**
   - Create `src/features/` directory
   - Move character-related code
   - Update imports
   - Estimated effort: 20-24 hours

2. **Form Hook Unification**
   - Implement `useEntityForm`
   - Refactor all form usage
   - Estimated effort: 16-20 hours

3. **State Management Cleanup**
   - Choose Redux alternative (Zustand recommended)
   - Migrate existing state
   - Estimated effort: 8-12 hours

**Deliverables:**
- Clearer project structure
- Simplified form handling
- Optimized state management

---

### Phase 4: Polish & Documentation (Weeks 7-8)
**Low Impact, Low Risk**

1. **Documentation**
   - Add JSDoc to all public APIs
   - Create component documentation
   - Update README
   - Estimated effort: 12-16 hours

2. **Testing Infrastructure**
   - Expand test utilities
   - Add component tests
   - Estimated effort: 16-20 hours

3. **Design System Refinement**
   - Implement design tokens
   - Create variant system
   - Estimated effort: 8-10 hours

**Deliverables:**
- Comprehensive documentation
- Improved test coverage
- Consistent design system

---

## Success Metrics

### Quantitative Metrics
- **Code Duplication:** Reduce by 30-40%
- **Component Reusability:** Increase reusable components from ~40 to ~70
- **Bundle Size:** Maintain or reduce current size
- **Type Coverage:** Maintain 100% TypeScript coverage
- **Test Coverage:** Increase from current to 60%+

### Qualitative Metrics
- **Developer Experience:** Faster feature development
- **Code Consistency:** Uniform patterns across codebase
- **Maintainability:** Easier to find and fix issues
- **Documentation:** Clear guidelines for new developers

---

## Risk Mitigation

### Technical Risks
1. **Breaking Changes**
   - Mitigation: Implement changes gradually
   - Use deprecation warnings before removing old APIs
   - Maintain comprehensive test suite

2. **Performance Impact**
   - Mitigation: Benchmark before and after changes
   - Use React DevTools Profiler
   - Monitor bundle size

3. **Team Adoption**
   - Mitigation: Provide training and documentation
   - Code review new patterns
   - Pair programming for complex refactors

### Rollback Strategy
- Implement changes in feature branches
- Use feature flags for major changes
- Maintain backward compatibility during migration
- Keep deprecation period of at least 2 weeks

---

## Conclusion

This refactor plan provides a structured approach to improving the Character Sheet application's codebase. By focusing on reusability, readability, and maintainability, we can create a more sustainable and enjoyable development experience.

The phased approach allows for incremental improvements with minimal risk, while the clear success metrics ensure we can measure the impact of our changes.

**Next Steps:**
1. Review and approve this plan
2. Create GitHub issues for Phase 1 tasks
3. Schedule kickoff meeting
4. Begin implementation
