import { Router } from 'express';

// Keep these in sync with `client/src/constants.ts` for now.
const CIRCUITS = [
  {
    id: 'blitz',
    title: 'BLITZ CIRCUIT 120 KM',
    subtitle: 'Main Racing Category (Competitive)',
    description:
      'Recommended for pro cyclists, the Blitz Circuit offers prize money across each category. The team race is open to all ages, and teams can be constituted of members from different age groups.',
    icon: 'landscape',
    imageUrl: '',
    price: 2000,
    date: '5th July 2026',
    time: '07:00 AM',
    location: 'Ulinzi Sports Complex, Langata',
  },
  {
    id: 'recon',
    title: 'RECON CIRCUIT 60 KM',
    subtitle: 'Intermediate Circuit (Competitive)',
    description:
      'Recommended for regular cyclists, the Recon Circuit offers prize money across both Team and Individual categories. The race is open to all ages, and teams can be constituted of members from different age groups.',
    icon: 'bolt',
    imageUrl: '',
    price: 2000,
    date: '5th July 2026',
    time: '07:30 AM',
    location: 'Ulinzi Sports Complex, Langata',
  },
  {
    id: 'corporate',
    title: 'CORPORATE CHALLENGE RIDE 30 KM',
    subtitle: 'Non-Competitive Team Ride',
    description:
      'Recommended for corporate teams, we invite teams of three to five to compete for organizational glory, with medals and awards presented to participants in recognition of their collective achievement.',
    icon: 'groups',
    imageUrl: '',
    price: 9000,
    date: '5th July 2026',
    time: '08:30 AM',
    location: 'Ulinzi Sports Complex, Langata',
  },
  {
    id: 'family',
    title: 'FAMILY FUN RIDE 5 KM',
    subtitle: 'Leisure, Safe for all ages',
    description:
      'A fun-filled event designed to ignite a passion for cycling in children within a safe environment. Cubs and Champs must be accompanied by a guardian.',
    icon: 'family_restroom',
    imageUrl: '',
    price: 1000,
    date: '5th July 2026',
    time: '10:00 AM',
    location: 'Ulinzi Sports Complex, Langata',
  },
] as const;

export const circuitsRouter = Router();

circuitsRouter.get('/', (_req, res) => {
  res.json({ circuits: CIRCUITS });
});

