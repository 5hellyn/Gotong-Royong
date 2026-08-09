export type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
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

let eventStore: EventItem[] = [
  {
    id: 'river-cleanup',
    title: 'River Cleanup',
    date: 'Saturday, July 12',
    time: '9:00 AM - 12:00 PM',
    location: 'Waterfront Park',
    summary: 'Join neighbors to clean the riverfront and protect wildlife.',
    category: 'cleanup',
    organizer: 'Green City Volunteers',
    capacity: 25,
    signedUp: 18,
    description:
      'Volunteers will collect trash, remove invasive plants, and install new signage along the waterfront trail. This event supports local habitat restoration and community education.',
    requirements: ['Closed-toe shoes', 'Reusable water bottle', 'Sun protection'],
    schedule: 'Arrival at 8:45 AM, safety briefing at 9:00 AM.',
    accessibility: 'Flat paths and volunteer support.',
    contact: 'volunteer@greencity.org'
  },
  {
    id: 'food-bank-sort',
    title: 'Food Bank Sort',
    date: 'Monday, July 14',
    time: '3:00 PM - 6:00 PM',
    location: 'Northside Warehouse',
    summary: 'Organize food donations and prepare kits for families.',
    category: 'food',
    organizer: 'Harvest Helpers',
    capacity: 30,
    signedUp: 22,
    description:
      'Help sort donated food, assemble packages, and prepare deliveries for local families in need. Volunteers will learn food-safety best practices and support supply chain efficiency.',
    requirements: ['Comfortable clothing', 'Face mask if needed', 'Positive attitude'],
    schedule: 'Check-in at 2:45 PM, team assignment at 3:00 PM.',
    accessibility: 'Ground-floor work area with wide aisles.',
    contact: 'info@harvesthelpers.org'
  },
  {
    id: 'reading-buddy-session',
    title: 'Reading Buddy Session',
    date: 'Thursday, July 17',
    time: '5:30 PM - 7:00 PM',
    location: 'Bellevue Library',
    summary: 'Support children with reading practice.',
    category: 'education',
    organizer: 'Literacy Link',
    capacity: 15,
    signedUp: 10,
    description:
      'Work one-on-one with young readers to build confidence and fluency. Volunteers will help guide reading exercises and celebrate progress in a supportive environment.',
    requirements: ['Patient attitude', 'Love of reading'],
    schedule: 'Registration at 5:15 PM, story time at 5:30 PM.',
    accessibility: 'Quiet study room with comfortable seating.',
    contact: 'contact@literacylink.org'
  }
];

export const events = eventStore;

export const addEvent = (event: EventItem) => {
  eventStore = [...eventStore, event];
};
