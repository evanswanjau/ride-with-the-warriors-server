/**
 * Saved drafts and entries of the logged-in account (services/registrations/drafts.ts).
 *
 *   GET    /api/v1/entries/draft                    the account's draft for the current event, or null
 *   PUT    /api/v1/entries/draft                    start it, or change circuit, type, team name, hire bike
 *   POST   /api/v1/entries/draft/riders             add a saved rider { riderProfileId } or a new one { rider }
 *   PATCH  /api/v1/entries/draft/riders/:riderId    change a rider's details
 *   DELETE /api/v1/entries/draft/riders/:riderId    take a rider off
 *   POST   /api/v1/entries/draft/confirm            confirm a draft that costs nothing
 *   POST   /api/v1/entries/draft/copy               start from an earlier entry { fromEntryId } (same team as last year)
 *   POST   /api/v1/entries/draft/invites            invite team members { members, send? }
 *   POST   /api/v1/entries/draft/invites/send       send invites (again) { inviteIds? }
 *   DELETE /api/v1/entries/draft/invites/:inviteId  withdraw an invite (a member who joined is taken off)
 *   GET    /api/v1/entries/:id                      one of the account's entries (draft or paid)
 *
 * Every answer that changes the draft returns it as { draft }, with `missing` (what it still
 * needs) and `ready`. Paying: POST /api/v1/registrations/pay/stk-push { entryId, phoneNumber }.
 */
import { Router, type Response } from 'express';
import { ZodError } from 'zod';
import { requireUser, type UserRequest } from '../middleware/userAuth.js';
import { currentEvent, eventForYear, registrationOpen, type EventRow } from '../services/events.js';
import { zodToApiError } from '../validation/zodError.js';
import { addDraftRiderSchema, copyEntrySchema, draftHeaderSchema, draftRiderPatchSchema, inviteMembersSchema, sendInvitesSchema } from '../validation/draftSchemas.js';
import { copyFromEntry } from '../services/registrations/draftCopy.js';
import { inviteMembers, revokeInvite, sendInvites } from '../services/registrations/teamInvites.js';
import { DraftError, entryView, findDraft, saveDraftHeader } from '../services/registrations/drafts.js';
import { addDraftRider, editDraftRider, removeDraftRider } from '../services/registrations/draftRiders.js';
import { confirmFreeDraft } from '../services/registrations/entryPayment.js';
import { prisma } from '../storage/prisma.js';

export const entriesRouter = Router();
entriesRouter.use(requireUser);

const CLOSED = { code: 'REGISTRATION_CLOSED', message: 'Registration is closed.' };

/** The current event, when registration is open; otherwise answers 403. */
async function openEvent(res: Response): Promise<EventRow | null> {
    const event = await currentEvent();
    if (registrationOpen(event)) return event;
    res.status(403).json({ error: CLOSED });
    return null;
}

/** Sends a refusal the services raise; anything else goes to the error handler. */
export function fail(res: Response, next: (err: unknown) => void, err: unknown) {
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    if (err instanceof DraftError) return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
    next(err);
}

entriesRouter.get('/draft', async (req: UserRequest, res, next) => {
    try {
        const event = await currentEvent();
        const draft = await findDraft(req.account!.id, event.year);
        res.json({ draft: draft ? await entryView(draft.id, event) : null });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.put('/draft', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const body = draftHeaderSchema.parse(req.body ?? {});
        const { entryId, created } = await saveDraftHeader(req.account!.id, event, body);
        res.status(created ? 201 : 200).json({ draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.post('/draft/riders', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const body = addDraftRiderSchema.parse(req.body ?? {});
        const { entryId, riderId } = await addDraftRider(req.account!.id, event, body);
        res.status(201).json({ riderId, draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.patch('/draft/riders/:riderId', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const body = draftRiderPatchSchema.parse(req.body ?? {});
        const { entryId } = await editDraftRider(req.account!.id, event, req.params.riderId, body);
        res.json({ draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.delete('/draft/riders/:riderId', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const { entryId } = await removeDraftRider(req.account!.id, event, req.params.riderId);
        res.json({ draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.post('/draft/confirm', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const draft = await findDraft(req.account!.id, event.year);
        if (!draft) throw new DraftError(404, 'NO_DRAFT', 'Draft not found');
        await confirmFreeDraft(req.account!.id, event, draft.id);
        res.json({ entry: await entryView(draft.id, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.post('/draft/copy', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const body = copyEntrySchema.parse(req.body ?? {});
        const { entryId, skipped, invited } = await copyFromEntry(req.account!.id, event, body.fromEntryId);
        res.json({ skipped, invited, draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.post('/draft/invites', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const body = inviteMembersSchema.parse(req.body ?? {});
        const { entryId, invites } = await inviteMembers(req.account!, event, body.members, body.send ?? true);
        res.status(201).json({ invites, draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.post('/draft/invites/send', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const body = sendInvitesSchema.parse(req.body ?? {});
        const { entryId, invites } = await sendInvites(req.account!, event, body.inviteIds);
        res.json({ invites, draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.delete('/draft/invites/:inviteId', async (req: UserRequest, res, next) => {
    try {
        const event = await openEvent(res);
        if (!event) return;
        const { entryId } = await revokeInvite(req.account!.id, event, req.params.inviteId);
        res.json({ draft: await entryView(entryId, event) });
    } catch (err) {
        fail(res, next, err);
    }
});

entriesRouter.get('/:id', async (req: UserRequest, res, next) => {
    try {
        const entry = await prisma.registrationGroup.findUnique({ where: { id: req.params.id }, select: { id: true, accountId: true, eventYear: true } });
        if (!entry || entry.accountId !== req.account!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } });
        res.json({ entry: await entryView(entry.id, await eventForYear(entry.eventYear)) });
    } catch (err) {
        fail(res, next, err);
    }
});
