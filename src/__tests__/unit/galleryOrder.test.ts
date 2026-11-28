import { describe, it, expect } from 'vitest';
import { orderAlbum, type OrderRow } from '../../scripts/galleryOrder.js';

const apply = (rows: OrderRow[], updates: { id: string; sortOrder: number; caption: string | null }[]) =>
    rows.map(r => ({ ...r, ...(updates.find(u => u.id === r.id) ?? {}) }));
const row = (n: number, extra: Partial<OrderRow> = {}): OrderRow => ({ id: `id${n}`, publicId: `rwtw/2026/x/p${n}`, sortOrder: n, caption: null, ...extra });

describe('orderAlbum', () => {
    const rows = [row(1), row(2), row(10), row(3)];

    it('puts picks first, best score first, the rest in name order', () => {
        const picks = new Map([['rwtw/2026/x/p10', { score: 40, caption: 'Ten' }], ['rwtw/2026/x/p2', { score: 44, caption: 'Two' }]]);
        const { updates, picks: n, rest } = orderAlbum(rows, picks);
        const done = apply(rows, updates).sort((a, b) => a.sortOrder - b.sortOrder).map(r => r.publicId.split('/').pop());
        expect(n).toBe(2);
        expect(rest).toBe(2);
        expect(done).toEqual(['p2', 'p10', 'p1', 'p3']);
    });

    it('captions picks only and leaves other captions alone', () => {
        const input = [row(1, { caption: 'Old' }), row(2)];
        const picks = new Map([['rwtw/2026/x/p2', { score: 30, caption: 'Hello' }]]);
        const done = apply(input, orderAlbum(input, picks).updates);
        expect(done.find(r => r.id === 'id2')?.caption).toBe('Hello');
        expect(done.find(r => r.id === 'id1')?.caption).toBe('Old');
    });

    it('is a no-op the second time', () => {
        const picks = new Map([['rwtw/2026/x/p3', { score: 41, caption: 'Three' }]]);
        const first = orderAlbum(rows, picks);
        const applied = rows.map(r => { const u = first.updates.find(x => x.id === r.id); return u ? { ...r, ...u } : r; });
        expect(orderAlbum(applied, picks).updates).toEqual([]);
    });

    it('with no picks keeps name order', () => {
        const { updates } = orderAlbum([row(3, { sortOrder: 0 }), row(1, { sortOrder: 1 })], new Map());
        expect(updates.find(u => u.id === 'id1')?.sortOrder).toBe(0);
        expect(updates.find(u => u.id === 'id3')?.sortOrder).toBe(1);
    });
});
