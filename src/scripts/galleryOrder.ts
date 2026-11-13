/** Ordering rules for gallery albums, shared by the picks script and its tests. */

export interface OrderRow { id: string; publicId: string; sortOrder: number; caption: string | null }
export interface OrderPick { score: number; caption?: string }

const byName = (a: OrderRow, b: OrderRow) => a.publicId.localeCompare(b.publicId, undefined, { numeric: true });

/**
 * Picks first (best score first), every other photo after them in name order.
 * Returns only rows whose sort order or caption changes, so re-running is a no-op.
 */
export function orderAlbum(rows: OrderRow[], picks: Map<string, OrderPick>) {
    const inName = [...rows].sort(byName);
    const top = inName.filter(r => picks.has(r.publicId)).sort((a, b) => picks.get(b.publicId)!.score - picks.get(a.publicId)!.score);
    const rest = inName.filter(r => !picks.has(r.publicId));
    const updates: { id: string; sortOrder: number; caption: string | null }[] = [];
    [...top, ...rest].forEach((r, i) => {
        const caption = picks.get(r.publicId)?.caption ?? r.caption;
        if (r.sortOrder !== i || r.caption !== caption) updates.push({ id: r.id, sortOrder: i, caption });
    });
    return { picks: top.length, rest: rest.length, updates };
}
