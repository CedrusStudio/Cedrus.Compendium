import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: vi.fn(() => ({ tags: [], isLoading: false, error: null }))
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    loading: 'Ładowanie...',
    selectExistingTag: 'wybierz istniejący tag',
    noTagsFound: 'nie znaleziono tagów',
    searchTags: 'szukaj tagów...',
  }
}));

vi.mock('@/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void }) => (
    <div data-testid="popover" data-open={open}>{children}</div>
  ),
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
}));

vi.mock('@/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => <div data-testid="command">{children}</div>,
  CommandInput: ({ placeholder }: { placeholder?: string }) => <input data-testid="command-input" placeholder={placeholder} />,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="command-group">{children}</div>,
  CommandList: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
  CommandItem: ({ children, value, onSelect }: { children: React.ReactNode; value: string; onSelect: () => void }) => (
    <div data-testid={`command-item-${value}`} onClick={onSelect}>{children}</div>
  ),
}));

vi.mock('@/common/components/ui/button', () => ({
  Button: ({ children, disabled, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button disabled={disabled} onClick={onClick} data-testid="trigger-button" {...rest}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronsUpDown: () => <span data-testid="chevron-icon" />,
  Tag: () => <span data-testid="tag-icon" />,
}));

import { useEntityTags } from '@/common/hooks/useEntityTags';
import ExistingTagDropdown from '@/common/components/inputs/ExistingTagDropdown';

describe('ExistingTagDropdown', () => {
  const defaultProps = {
    entityType: 'perks' as const,
    currentTags: [],
    maxTags: 15,
    onSelectTag: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading text when isLoading is true', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: [], isLoading: true, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      expect(screen.getByText('Ładowanie...')).toBeTruthy();
    });

    it('should disable button when loading', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: [], isLoading: true, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      const button = screen.getByTestId('trigger-button');
      expect(button).toBeDisabled();
    });
  });

  describe('with available tags', () => {
    it('should show select tag text when not loading and tags are available', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior', 'mage'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      expect(screen.getByText('wybierz istniejący tag')).toBeTruthy();
    });

    it('should render tag items in command list', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior', 'mage'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      expect(screen.getByTestId('command-item-warrior')).toBeTruthy();
      expect(screen.getByTestId('command-item-mage')).toBeTruthy();
    });

    it('should not show tags that are already selected', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior', 'mage', 'rogue'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} currentTags={['warrior']} />);

      expect(screen.queryByTestId('command-item-warrior')).toBeNull();
      expect(screen.getByTestId('command-item-mage')).toBeTruthy();
      expect(screen.getByTestId('command-item-rogue')).toBeTruthy();
    });

    it('should call onSelectTag when a tag is clicked', () => {
      const onSelectTag = vi.fn();
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} onSelectTag={onSelectTag} />);

      fireEvent.click(screen.getByTestId('command-item-warrior'));

      expect(onSelectTag).toHaveBeenCalledWith('warrior');
    });
  });

  describe('disabled state', () => {
    it('should disable button when max tags reached', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['a', 'b', 'c'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} currentTags={['x', 'y', 'z']} maxTags={3} />);

      const button = screen.getByTestId('trigger-button');
      expect(button).toBeDisabled();
    });

    it('should disable button when no available tags remain', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} currentTags={['warrior']} />);

      const button = screen.getByTestId('trigger-button');
      expect(button).toBeDisabled();
    });

    it('should disable button when disabled prop is true', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} disabled={true} />);

      const button = screen.getByTestId('trigger-button');
      expect(button).toBeDisabled();
    });
  });

  describe('empty state', () => {
    it('should show no tags found message when entity has no tags', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: [], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      expect(screen.getByTestId('command-empty')).toBeTruthy();
      expect(screen.getByText('nie znaleziono tagów')).toBeTruthy();
    });
  });

  describe('search input', () => {
    it('should render search input with correct placeholder', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['warrior'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      const input = screen.getByTestId('command-input');
      expect(input).toHaveAttribute('placeholder', 'szukaj tagów...');
    });
  });

  describe('tag sorting', () => {
    it('should display available tags sorted alphabetically', () => {
      vi.mocked(useEntityTags).mockReturnValue({ tags: ['zebra', 'apple', 'mango'], isLoading: false, error: null });

      render(<ExistingTagDropdown {...defaultProps} />);

      const items = screen.getAllByTestId(/command-item-/);
      expect(items[0].getAttribute('data-testid')).toBe('command-item-apple');
      expect(items[1].getAttribute('data-testid')).toBe('command-item-mango');
      expect(items[2].getAttribute('data-testid')).toBe('command-item-zebra');
    });
  });
});
