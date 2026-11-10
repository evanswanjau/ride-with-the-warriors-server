/**
 * Mock DTB (Fiorano) M-Pesa gateway for local development and tests.
 *
 *   npm run mock:dtb            → http://localhost:4010 (dashboard)
 *
 * It speaks the same API as DTB:
 *   POST /auth/token   → { access_token, expires_in }
 *   POST /stkpush      → { status: "SUCCESS", responseCode: "200", externalReference }
 * and then calls the `UserCallback` URL the way DTB does, according to the
 * current mode:
 *
 *   success            callback SUCCESS after the delay
 *   fail               callback FAILURE ("Request cancelled by user")
 *   timeout            never calls back (payment stays pending)
 *   duplicate          SUCCESS twice
 *   fail_after_success SUCCESS, then a late FAILURE
 *   reject             /stkpush itself answers 400 (prompt never sent)
 *   manual             no automatic callback; use the dashboard buttons
 *
 * Change the mode from the dashboard, or from tests:
 *   POST /__control { mode, delayMs?, once? }   (once=true → applies to the next push only)
 *   GET  /__pushes                              → every push received
 *   POST /__pushes/:ref/callback { outcome: "success" | "fail" }
 *   POST /__reset
 */
import express from 'express';

type Mode = 'success' | 'fail' | 'timeout' | 'duplicate' | 'fail_after_success' | 'reject' | 'manual';
const MODES: Mode[] = ['success', 'fail', 'timeout', 'duplicate', 'fail_after_success', 'reject', 'manual'];

type Push = {
    ref: string;
    amount: number;
    phone: string;
    description: string;
    callbackUrl: string;
    mode: Mode;
    receivedAt: string;
    callbacks: { at: string; outcome: 'success' | 'fail'; httpStatus: number | string }[];
};

const PORT = Number(process.env.MOCK_DTB_PORT ?? 4010);
let mode: Mode = (process.env.MOCK_DTB_MODE as Mode) || 'success';
let delayMs = Number(process.env.MOCK_DTB_DELAY_MS ?? 3000);
let onceMode: Mode | null = null;
const pushes: Push[] = [];

function receipt() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    return 'S' + Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function sendCallback(push: Push, outcome: 'success' | 'fail') {
    const body = outcome === 'success'
        ? {
            status: 'SUCCESS',
            responseCode: '200',
            responseDescription: 'The service request is processed successfully.',
            externalReference: push.ref,
            mnoReference: receipt(),
            cbsReference: 'CBS' + Date.now(),
            transactionId: 'TX' + Date.now(),
        }
        : {
            status: 'FAILURE',
            responseCode: '400',
            responseDescription: 'Request cancelled by user',
            externalReference: push.ref,
            mnoReference: '',
            cbsReference: '',
            transactionId: 'TX' + Date.now(),
        };
    let httpStatus: number | string;
    try {
        const res = await fetch(push.callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        httpStatus = res.status;
    } catch (err) {
        httpStatus = `error: ${(err as Error).message}`;
    }
    push.callbacks.push({ at: new Date().toISOString(), outcome, httpStatus });
    console.log(`[mock-dtb] callback ${outcome.toUpperCase()} for ${push.ref} → ${httpStatus}`);
}

function schedule(push: Push) {
    const later = (ms: number, outcome: 'success' | 'fail') => setTimeout(() => void sendCallback(push, outcome), ms);
    switch (push.mode) {
        case 'success': later(delayMs, 'success'); break;
        case 'fail': later(delayMs, 'fail'); break;
        case 'duplicate': later(delayMs, 'success'); later(delayMs + 1000, 'success'); break;
        case 'fail_after_success': later(delayMs, 'success'); later(delayMs + 1500, 'fail'); break;
        default: break; // timeout, manual
    }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post(['/auth/token', '/api/fiorano/dev-portal/v2/auth/token'], (_req, res) => {
    res.json({ access_token: 'mock-dtb-token', token_type: 'Bearer', expires_in: 3600 });
});

app.post(['/stkpush', '/api/fiorano/mno/mpesa/stkpush'], (req, res) => {
    if (req.headers.authorization !== 'Bearer mock-dtb-token') {
        return res.status(401).json({ message: 'Invalid token' });
    }
    const b = req.body ?? {};
    const pushMode = onceMode ?? mode;
    onceMode = null;
    if (!b.TransactionRef || !b.Amount || !b.PhoneNumber || !b.UserCallback) {
        return res.status(400).json({ status: 'FAILURE', responseCode: '400', responseDescription: 'Missing required fields' });
    }
    const push: Push = {
        ref: String(b.TransactionRef),
        amount: Number(b.Amount),
        phone: String(b.PhoneNumber),
        description: String(b.TransactionDesc ?? ''),
        callbackUrl: String(b.UserCallback),
        mode: pushMode,
        receivedAt: new Date().toISOString(),
        callbacks: [],
    };
    pushes.unshift(push);
    console.log(`[mock-dtb] STK push ${push.ref} KES ${push.amount} to ${push.phone} (mode: ${pushMode})`);

    if (pushMode === 'reject') {
        return res.status(400).json({ status: 'FAILURE', responseCode: '400', responseDescription: 'Mock DTB: push rejected', externalReference: push.ref });
    }
    schedule(push);
    res.json({
        status: 'SUCCESS',
        responseCode: '200',
        responseDescription: 'Success. Request accepted for processing',
        externalReference: push.ref,
    });
});

// ─── Control API (dashboard and tests) ───────────────────────────────────────

app.post('/__control', (req, res) => {
    const m = req.body?.mode as Mode | undefined;
    if (m && !MODES.includes(m)) return res.status(400).json({ error: `mode must be one of ${MODES.join(', ')}` });
    if (req.body?.delayMs !== undefined) delayMs = Math.max(0, Number(req.body.delayMs) || 0);
    if (m) {
        if (req.body?.once === true || req.body?.once === 'true') onceMode = m;
        else mode = m;
    }
    if (req.headers.accept?.includes('text/html') || req.is('application/x-www-form-urlencoded')) return res.redirect('/');
    res.json({ mode, onceMode, delayMs });
});

app.get('/__pushes', (_req, res) => res.json({ mode, onceMode, delayMs, pushes }));

app.post('/__pushes/:ref/callback', async (req, res) => {
    const push = pushes.find(p => p.ref === req.params.ref);
    if (!push) return res.status(404).json({ error: 'Unknown push' });
    const outcome = req.body?.outcome === 'fail' ? 'fail' : 'success';
    await sendCallback(push, outcome);
    if (req.is('application/x-www-form-urlencoded')) return res.redirect('/');
    res.json({ ok: true, push });
});

app.post('/__reset', (_req, res) => {
    pushes.length = 0;
    mode = 'success';
    onceMode = null;
    delayMs = Number(process.env.MOCK_DTB_DELAY_MS ?? 3000);
    if (_req.is('application/x-www-form-urlencoded')) return res.redirect('/');
    res.json({ ok: true });
});

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

app.get('/', (_req, res) => {
    const rows = pushes.map(p => `
      <tr>
        <td><code>${esc(p.ref.slice(0, 8))}</code></td>
        <td>${new Date(p.receivedAt).toLocaleTimeString()}</td>
        <td>KES ${p.amount.toLocaleString()}</td>
        <td>${esc(p.phone)}</td>
        <td>${esc(p.description)}</td>
        <td>${p.mode}</td>
        <td>${p.callbacks.map(c => `${c.outcome} → ${esc(String(c.httpStatus))}`).join('<br>') || '<em>none yet</em>'}</td>
        <td>
          <form method="post" action="/__pushes/${encodeURIComponent(p.ref)}/callback" style="display:inline">
            <input type="hidden" name="outcome" value="success"><button>Pay</button></form>
          <form method="post" action="/__pushes/${encodeURIComponent(p.ref)}/callback" style="display:inline">
            <input type="hidden" name="outcome" value="fail"><button>Fail</button></form>
        </td>
      </tr>`).join('');
    const options = MODES.map(m => `<option value="${m}" ${m === mode ? 'selected' : ''}>${m}</option>`).join('');
    res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Mock DTB</title>
<meta http-equiv="refresh" content="5">
<style>
  body{font:14px system-ui,sans-serif;margin:24px;color:#111;background:#fafafa}
  table{border-collapse:collapse;width:100%;background:#fff}
  td,th{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f0f0f0} code{font-size:12px} form{margin:0}
  .bar{display:flex;gap:16px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
</style></head><body>
<h1>Mock DTB (M-Pesa)</h1>
<div class="bar">
  <form method="post" action="/__control">
    Mode <select name="mode">${options}</select>
    Delay <input name="delayMs" value="${delayMs}" size="5"> ms
    <label><input type="checkbox" name="once" value="true"> next push only</label>
    <button>Save</button>
  </form>
  <form method="post" action="/__reset"><button>Reset</button></form>
  <span>Current: <b>${mode}</b>${onceMode ? ` (next push: <b>${onceMode}</b>)` : ''}</span>
</div>
<table><tr><th>Ref</th><th>Time</th><th>Amount</th><th>Phone</th><th>Description</th><th>Mode</th><th>Callbacks</th><th>Send now</th></tr>
${rows || '<tr><td colspan="8"><em>No STK pushes yet.</em></td></tr>'}
</table>
<p>Page refreshes every 5 seconds.</p>
</body></html>`);
});

app.listen(PORT, () => {
    console.log(`[mock-dtb] listening on http://localhost:${PORT} (mode: ${mode}, delay: ${delayMs}ms)`);
});
