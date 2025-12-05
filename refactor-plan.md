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
