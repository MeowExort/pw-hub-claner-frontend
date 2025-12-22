export function generateBannerGradient(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate two hues
    const h1 = Math.abs(hash % 360);
    const h2 = Math.abs((hash >> 3) % 360);

    // Saturation and Lightness - keep it relatively dark/deep for a background
    const s = 40 + (Math.abs(hash) % 40); // 40-80%
    const l = 20 + (Math.abs(hash) % 20); // 20-40%

    const c1 = `hsl(${h1}, ${s}%, ${l}%)`;
    const c2 = `hsl(${h2}, ${s}%, ${l - 10}%)`;

    const angle = Math.abs(hash % 360);

    return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
}
