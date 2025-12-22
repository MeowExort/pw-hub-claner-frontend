import {describe, it, expect} from 'vitest';
import {generateBannerGradient} from './color';

describe('generateBannerGradient', () => {
    it('returns a valid linear-gradient string', () => {
        const result = generateBannerGradient('Test Clan');
        expect(result).toContain('linear-gradient');
        expect(result).toContain('deg');
        expect(result).toContain('hsl(');
    });

    it('is deterministic', () => {
        const a = generateBannerGradient('Clan A');
        const b = generateBannerGradient('Clan A');
        expect(a).toBe(b);
    });

    it('produces different results for different seeds', () => {
        const a = generateBannerGradient('Clan A');
        const b = generateBannerGradient('Clan B');
        expect(a).not.toBe(b);
    });
});
