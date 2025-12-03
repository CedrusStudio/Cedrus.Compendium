import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { store } from '@/persistence/slices/store';

/**
 * Creates a test query client with default options optimized for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Creates a test Redux store (returns the main store for simplicity)
 */
export function createTestStore() {
  return store;
}

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all necessary providers for testing
 */
export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();
  const store = createTestStore();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  store?: typeof store;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    store = createTestStore(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    store,
  };
}

/**
 * Helper to wait for query loading to complete
 */
export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock form methods for react-hook-form testing
 */
export function createMockFormMethods<T extends Record<string, unknown>>() {
  return {
    register: vi.fn(),
    unregister: vi.fn(),
    formState: {
      errors: {},
      isDirty: false,
      isSubmitting: false,
      isValid: true,
      touchedFields: {},
      dirtyFields: {},
      isValidating: false,
      submitCount: 0,
    },
    watch: vi.fn(),
    handleSubmit: vi.fn((fn) => (e?: React.BaseSyntheticEvent) => {
      if (e) e.preventDefault();
      return fn({} as T);
    }),
    reset: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
    setValue: vi.fn(),
    setFocus: vi.fn(),
    getValues: vi.fn(),
    getFieldState: vi.fn(),
    trigger: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: {} as any,
  };
}

/**
 * Re-export everything from testing library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
