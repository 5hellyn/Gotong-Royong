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
  isRegistered?: boolean;
  createdBy?: number;
};

export type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // optional combined location or structured address
  location?: string;
  locationStreet?: string;
  locationCity?: string;
  locationState?: string;
  availability: string;
  interests: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreateEventPayload = {
  title: string;
  date: string;
  time: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location: string;
  // structured location fields
  locationStreet?: string;
  locationCity?: string;
  locationState?: string;
  summary: string;
  category: EventItem['category'];
  organizer: string;
  capacity: number;
  description: string;
  requirements: string[];
  schedule: string;
  accessibility: string;
  contact: string;
};

export type DashboardResponse = {
  stats: {
    eventsSignedUp: number;
    hoursVolunteered: number;
    eventsCreated: number;
  };
  upcomingEvents: EventItem[];
  availableEvents: EventItem[];
  profile: {
    location: string;
    availability: string;
    interests: string;
  };
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get('Content-Type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body
      ? (body as any).error
      : response.statusText || 'Request failed';
    throw new Error(message || 'Request failed');
  }

  return body as T;
}

export async function signup(payload: SignupPayload) {
  return fetchJson<{ user: Record<string, unknown>; message: string }>(
    `${apiBase}/auth/signup`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function login(payload: LoginPayload) {
  return fetchJson<{ user: Record<string, unknown>; message: string }>(
    `${apiBase}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function logout() {
  return fetchJson<{ message: string }>(
    `${apiBase}/auth/logout`,
    {
      method: 'POST',
    }
  );
}

export async function getCurrentUser() {
  return fetchJson<{ id: number; fullName: string; email: string; location: string; availability: string; interests: string }>(
    `${apiBase}/users/me`
  );
}

export async function updateCurrentUser(payload: { location?: string; locationStreet?: string; locationCity?: string; locationState?: string; availability: string; interests: string }) {
  return fetchJson<{ user: Record<string, unknown>; message: string }>(
    `${apiBase}/users/me`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  return fetchJson<{ message: string }>(
    `${apiBase}/users/me/password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function getEvents(filters?: {
  q?: string;
  location?: string;
  category?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.location) params.set('location', filters.location);
  if (filters?.category) params.set('category', filters.category);

  const url = `${apiBase}/events${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchJson<EventItem[]>(url);
}

export async function getEventDetail(eventId: string) {
  return fetchJson<EventItem>(`${apiBase}/events/${encodeURIComponent(eventId)}`);
}

export type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  location?: string;
  availability?: string;
  interests?: string;
};

export async function getEventAttendees(eventId: string) {
  return fetchJson<UserProfile[]>(`${apiBase}/events/${encodeURIComponent(eventId)}/attendees`);
}

export async function getMyCreatedEvents() {
  return fetchJson<EventItem[]>(`${apiBase}/events/created`);
}

export async function updateEvent(eventId: string, payload: CreateEventPayload) {
  return fetchJson<{ message: string; event: EventItem }>(
    `${apiBase}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteEvent(eventId: string) {
  return fetchJson<{ message: string }>(
    `${apiBase}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function createEvent(payload: CreateEventPayload) {
  return fetchJson<{ message: string; event: EventItem }>(
    `${apiBase}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function getDashboard() {
  return fetchJson<DashboardResponse>(`${apiBase}/dashboard`);
}

export async function registerForEvent(eventId: string) {
  return fetchJson<{ message: string; eventId: string; signedUp: number }>(
    `${apiBase}/events/${encodeURIComponent(eventId)}/register`,
    {
      method: 'POST',
    }
  );
}

export async function cancelRegistration(eventId: string) {
  return fetchJson<{ message: string; eventId: string; signedUp: number }>(
    `${apiBase}/events/${encodeURIComponent(eventId)}/register`,
    {
      method: 'DELETE',
    }
  );
}
