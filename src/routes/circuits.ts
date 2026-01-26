import { Router } from 'express';

// Keep these in sync with `client/src/constants.ts` for now.
const CIRCUITS = [
  {
    id: 'blitz',
    title: 'BLITZ CIRCUIT 120 KM',
    subtitle: 'Main Racing Category (Competitive)',
    description:
      'Choose from five competitive options with prizes to be won in each age category. The team race is open to all ages. Recommended for regular cyclists.',
    icon: 'landscape',
    imageUrl: '',
    price: 2000,
    date: 'Aug 24th, 2026',
    time: '06:00 AM',
    location: 'Karura Forest, Nairobi',
  },
  {
    id: 'intermediate',
    title: 'RECON CIRCUIT 60 KM',
    subtitle: 'Intermediate Circuit (Competitive)',
    description:
      'Competitive races for amateurs of all ages. Prizes to be won in both Team and Individual categories.',
    icon: 'bolt',
    imageUrl: '',
    price: 2000,
    date: 'Aug 24th, 2026',
    time: '07:30 AM',
    location: 'Karura Forest, Nairobi',
  },
  {
    id: 'corporate',
    title: 'CORPORATE CHALLENGE RIDE 30 KM',
    subtitle: 'Non-Competitive Team Ride',
    description:
      'Represent your organization. Groups of five riders competing for organizational glory. While there is no prize money, teams receive medals and participation awards.',
    icon: 'groups',
    imageUrl: '',
    price: 9000,
    date: 'Aug 24th, 2026',
    time: '07:00 AM',
    location: 'Karura Forest, Nairobi',
  },
  {
    id: 'family',
    title: 'FAMILY FUN RIDE 5 KM',
    subtitle: 'Leisure, Safe for all ages',
    description:
      'A fun-filled event for children of all ages to help ignite their passion for cycling in a safe environment.',
    icon: 'family_restroom',
    imageUrl: '',
    price: 1000,
    date: 'Aug 24th, 2026',
    time: '09:00 AM',
    location: 'Karura Forest, Nairobi',
  },
] as const;

export const circuitsRouter = Router();

circuitsRouter.get('/', (_req, res) => {
  res.json({ circuits: CIRCUITS });
});

