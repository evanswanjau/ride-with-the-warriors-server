/**
 * The team invite link a member opens (services/registrations/teamInvites.ts).
 *
 *   GET  /api/v1/invites/:token          what the invite is for (no login): team, circuit, captain
 *   POST /api/v1/invites/:token/accept   logged in: the member's own details join the team
 */
import { Router } from 'express';
import { optionalUser, requireUser, type UserRequest } from '../middleware/userAuth.js';
import { quoteLimiter } from '../middleware/rateLimit.js';
import { currentEvent, registrationOpen } from '../services/events.js';
import { acceptInvite, openInvite } from '../services/registrations/teamInvites.js';
import { acceptInviteSchema } from '../validation/draftSchemas.js';
import { fail } from './entries.js';

export const invitesRouter = Router();
invitesRouter.use(quoteLimiter);

invitesRouter.get('/:token', optionalUser, async (req, res, next) => {
    try {
        const invite = await openInvite(req.params.token);
        if (!invite) return res.status(404).json({ error: { code: 'INVITE_NOT_FOUND', message: 'This invite link is not valid. Ask your captain to send it again.' } });
        res.json({ invite });
    } catch (err) {
        fail(res, next, err);
    }
});

invitesRouter.post('/:token/accept', requireUser, async (req: UserRequest, res, next) => {
    try {
        if (!registrationOpen(await currentEvent())) return res.status(403).json({ error: { code: 'REGISTRATION_CLOSED', message: 'Registration is closed.' } });
        const details = acceptInviteSchema.parse(req.body ?? {});
        const joined = await acceptInvite(req.params.token, req.account!, details);
        res.status(201).json(joined);
    } catch (err) {
        fail(res, next, err);
    }
});
