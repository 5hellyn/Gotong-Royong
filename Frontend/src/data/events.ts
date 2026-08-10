export type EventItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  locationStreet?: string;
  locationCity?: string;
  locationState?: string;
  summary: string;
  category: 'cleanup' | 'education' | 'food';
  organizer: string;
  capacity: number;
  signedUp: number;
  description: string;
  requirements: string[];
  schedule: string;
  accessibility: string;
  contact: string;
};

let eventStore: EventItem[] = [];

export const events = eventStore;

export const addEvent = (event: EventItem) => {
  eventStore = [...eventStore, event];
};
