import { describe, it, expect } from 'vitest';
import {
  isValidTag,
  isCharacterOrSessionTag,
  CharacterTag,
  SessionTagPrefix,
  type Tag,
} from '@/domain/Tag';

describe('Tag - Tag Validation System', () => {
  describe('isValidTag()', () => {
    describe('valid tags', () => {
      it('should accept lowercase single word', () => {
        expect(isValidTag('warrior')).toBe(true);
        expect(isValidTag('mage')).toBe(true);
        expect(isValidTag('rogue')).toBe(true);
      });

      it('should accept lowercase with hyphens', () => {
        expect(isValidTag('fire-mage')).toBe(true);
        expect(isValidTag('dark-knight')).toBe(true);
        expect(isValidTag('arch-wizard')).toBe(true);
      });

      it('should accept lowercase with underscores', () => {
        expect(isValidTag('fire_mage')).toBe(true);
        expect(isValidTag('dark_knight')).toBe(true);
        expect(isValidTag('arch_wizard')).toBe(true);
      });

      it('should accept lowercase with numbers', () => {
        expect(isValidTag('level1')).toBe(true);
        expect(isValidTag('warrior2')).toBe(true);
        expect(isValidTag('3rdedition')).toBe(true);
      });

      it('should accept single lowercase character', () => {
        expect(isValidTag('a')).toBe(true);
        expect(isValidTag('z')).toBe(true);
        expect(isValidTag('x')).toBe(true);
      });

      it('should reject empty string', () => {
        expect(isValidTag('')).toBe(false);
      });

      it('should accept special characters without spaces', () => {
        expect(isValidTag('tag-with-dash')).toBe(true);
        expect(isValidTag('tag_with_underscore')).toBe(true);
        expect(isValidTag('tag.with.dots')).toBe(true);
      });

      it('should accept polish characters if lowercase', () => {
        expect(isValidTag('postać')).toBe(true);
        expect(isValidTag('sesja-1')).toBe(true);
        expect(isValidTag('łucznik')).toBe(true);
      });
    });

    describe('invalid tags', () => {
      it('should reject tags with uppercase letters', () => {
        expect(isValidTag('Warrior')).toBe(false);
        expect(isValidTag('MAGE')).toBe(false);
        expect(isValidTag('Rogue')).toBe(false);
      });

      it('should reject tags with spaces', () => {
        expect(isValidTag('fire mage')).toBe(false);
        expect(isValidTag('dark knight')).toBe(false);
        expect(isValidTag('arch wizard')).toBe(false);
      });

      it('should reject tags with mixed case', () => {
        expect(isValidTag('FireMage')).toBe(false);
        expect(isValidTag('darkKnight')).toBe(false);
        expect(isValidTag('ArchWizard')).toBe(false);
      });

      it('should reject tags with leading space', () => {
        expect(isValidTag(' warrior')).toBe(false);
        expect(isValidTag('  mage')).toBe(false);
      });

      it('should reject tags with trailing space', () => {
        expect(isValidTag('warrior ')).toBe(false);
        expect(isValidTag('mage  ')).toBe(false);
      });

      it('should reject tags with multiple words', () => {
        expect(isValidTag('fire mage warrior')).toBe(false);
        expect(isValidTag('level 5 warrior')).toBe(false);
      });

      it('should reject tags with internal spaces', () => {
        expect(isValidTag('war rior')).toBe(false);
        expect(isValidTag('ma ge')).toBe(false);
      });

      it('should reject tags with uppercase polish characters', () => {
        expect(isValidTag('Postać')).toBe(false);
        expect(isValidTag('POSTAĆ')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle very long valid tags', () => {
        const longTag = 'a'.repeat(1000);
        expect(isValidTag(longTag)).toBe(true);
      });

      it('should handle very long invalid tags with space', () => {
        const longTag = 'a'.repeat(500) + ' ' + 'b'.repeat(500);
        expect(isValidTag(longTag)).toBe(false);
      });

      it('should handle tags with only numbers', () => {
        expect(isValidTag('12345')).toBe(true);
      });

      it('should handle tags with only special characters', () => {
        expect(isValidTag('---')).toBe(true);
        expect(isValidTag('___')).toBe(true);
      });

      it('should handle tags with mixed special characters', () => {
        expect(isValidTag('tag-with_multiple.special-chars')).toBe(true);
      });
    });
  });

  describe('isCharacterOrSessionTag()', () => {
    describe('character tag', () => {
      it('should recognize character tag', () => {
        expect(isCharacterOrSessionTag(CharacterTag)).toBe(true);
      });

      it('should recognize "postać" as character tag', () => {
        expect(isCharacterOrSessionTag('postać')).toBe(true);
      });
    });

    describe('session tags', () => {
      it('should recognize session tags with prefix', () => {
        expect(isCharacterOrSessionTag('sesja-1')).toBe(true);
        expect(isCharacterOrSessionTag('sesja-2')).toBe(true);
        expect(isCharacterOrSessionTag('sesja-10')).toBe(true);
      });

      it('should recognize session tag with only prefix', () => {
        expect(isCharacterOrSessionTag('sesja-')).toBe(true);
      });

      it('should recognize session tags with additional text', () => {
        expect(isCharacterOrSessionTag('sesja-piątkowa')).toBe(true);
        expect(isCharacterOrSessionTag('sesja-intro')).toBe(true);
        expect(isCharacterOrSessionTag('sesja-finale')).toBe(true);
      });

      it('should verify session tag prefix constant', () => {
        expect(SessionTagPrefix).toBe('sesja-');
      });
    });

    describe('non-special tags', () => {
      it('should reject regular tags', () => {
        expect(isCharacterOrSessionTag('warrior')).toBe(false);
        expect(isCharacterOrSessionTag('mage')).toBe(false);
        expect(isCharacterOrSessionTag('rogue')).toBe(false);
      });

      it('should reject tags with similar but different text', () => {
        expect(isCharacterOrSessionTag('postacie')).toBe(false);
        expect(isCharacterOrSessionTag('postac')).toBe(false);
        expect(isCharacterOrSessionTag('sesje')).toBe(false);
        expect(isCharacterOrSessionTag('sesja')).toBe(false);
      });

      it('should reject tags that contain but do not start with prefix', () => {
        expect(isCharacterOrSessionTag('next-sesja-1')).toBe(false);
        expect(isCharacterOrSessionTag('my-sesja-')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isCharacterOrSessionTag('')).toBe(false);
      });

      it('should reject tags with uppercase', () => {
        expect(isCharacterOrSessionTag('Postać')).toBe(false);
        expect(isCharacterOrSessionTag('Sesja-1')).toBe(false);
      });

      it('should reject tags with spaces', () => {
        expect(isCharacterOrSessionTag('sesja 1')).toBe(false);
        expect(isCharacterOrSessionTag('post ać')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle tags very similar to session prefix', () => {
        expect(isCharacterOrSessionTag('sesj-')).toBe(false);
        expect(isCharacterOrSessionTag('sesja')).toBe(false);
        expect(isCharacterOrSessionTag('sesjaa-')).toBe(false);
      });

      it('should handle tags very similar to character tag', () => {
        expect(isCharacterOrSessionTag('postac')).toBe(false);
        expect(isCharacterOrSessionTag('postacc')).toBe(false);
        expect(isCharacterOrSessionTag('postaci')).toBe(false);
      });

      it('should be case sensitive for character tag', () => {
        expect(isCharacterOrSessionTag('POSTAĆ')).toBe(false);
        expect(isCharacterOrSessionTag('Postać')).toBe(false);
      });

      it('should be case sensitive for session tags', () => {
        expect(isCharacterOrSessionTag('SESJA-1')).toBe(false);
        expect(isCharacterOrSessionTag('Sesja-1')).toBe(false);
      });
    });

    describe('integration with valid tags', () => {
      it('should accept valid character or session tags', () => {
        const characterTag: Tag = 'postać';
        const sessionTag: Tag = 'sesja-1';
        expect(isValidTag(characterTag)).toBe(true);
        expect(isValidTag(sessionTag)).toBe(true);
        expect(isCharacterOrSessionTag(characterTag)).toBe(true);
        expect(isCharacterOrSessionTag(sessionTag)).toBe(true);
      });

      it('should handle valid tags that are not special', () => {
        const regularTag: Tag = 'warrior';
        expect(isValidTag(regularTag)).toBe(true);
        expect(isCharacterOrSessionTag(regularTag)).toBe(false);
      });

      it('should reject invalid tags even if they look special', () => {
        const invalidTag = 'Sesja-1'; // uppercase
        expect(isValidTag(invalidTag)).toBe(false);
        // isCharacterOrSessionTag doesn't validate, it checks content
        expect(isCharacterOrSessionTag(invalidTag as Tag)).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    it('should have correct CharacterTag value', () => {
      expect(CharacterTag).toBe('postać');
    });

    it('should have correct SessionTagPrefix value', () => {
      expect(SessionTagPrefix).toBe('sesja-');
    });

    it('should have CharacterTag as valid tag', () => {
      expect(isValidTag(CharacterTag)).toBe(true);
    });

    it('should have SessionTagPrefix as valid tag when used', () => {
      expect(isValidTag(SessionTagPrefix + '1')).toBe(true);
    });
  });
});
