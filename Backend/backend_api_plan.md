# Backend API Plan for the Volunteer Event Frontend

This document outlines the backend API surface needed to support the current React frontend. It is written as a planning document for a Python backend (recommended: FastAPI) and does not implement the API yet.

## 1. Frontend features that need backend support

The current frontend includes the following user flows:

- Sign up page collects a user profile and redirects to the dashboard after a successful account creation.
- Dashboard page expects user-specific summary data such as signed-up events, volunteer hours, and pending invites.
- Listing page needs a list of events that can be filtered by keyword, location, and category.
- Detail page needs event details for a specific event ID.
- UI buttons for “Sign Up” and “Cancel” suggest backend support for event registration actions.

## 2. Core data models

### User
- id
- firstName
- lastName
- email
- password
- locationStreet
- locationCity
- locationState
- availability
- interests
- created_at

### Event
- id
- title
- startDate
- endDate
- startTime
- endTime
- locationStreet
- locationCity
- locationState
- summary
- category
- organizer
- capacity
- signedUp
- description
- requirements
- schedule
- accessibility
- contact

### EventRegistration
- id
- user_id
- event_id
- status (registered, canceled, pending)
- registered_at

## 3. Recommended API endpoints

### Authentication and user profile

#### POST /api/auth/signup
Creates a new volunteer account.

Request body:
```json
{
  "firstName": "Maya",
  "lastName": "Chen",
  "email": "maya@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "locationStreet": "123 Main St",
  "locationCity": "Seattle",
  "locationState": "WA",
  "availability": "Weekends, Evenings",
  "interests": "Community cleanup, Education"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "firstName": "Maya",
    "lastName": "Chen",
    "email": "maya@example.com",
    "locationStreet": "123 Main St",
    "locationCity": "Seattle",
    "locationState": "WA",
    "availability": "Weekends, Evenings",
    "interests": "Community cleanup, Education"
  },
  "message": "Account created successfully"
}
```

#### POST /api/auth/login
Optional, but useful if the frontend later adds a login flow.

#### GET /api/users/me
Returns the currently authenticated user profile.

#### PUT /api/users/me
Updates profile fields such as location, availability, or interests.

### Events

#### GET /api/events
Returns a list of events.

Query parameters:
- q: keyword search
- location: location filter
- category: cleanup, education, food

Example:
```http
GET /api/events?q=cleanup&location=Seattle&category=cleanup
```

Response:
```json
[
  {
    "id": 1,
    "title": "River Cleanup",
    "startDate": "2025-07-12",
    "endDate": "2025-07-12",
    "startTime": "09:00",
    "endTime": "12:00",
    "locationStreet": "123 Waterfront Rd",
    "locationCity": "Seattle",
    "locationState": "WA",
    "summary": "Join neighbors to clean the riverfront and protect wildlife.",
    "category": "cleanup",
    "organizer": "Green City Volunteers",
    "capacity": 25,
    "signedUp": 18,
    "description": "Volunteers will collect trash and restore the waterfront trail.",
    "requirements": ["Closed-toe shoes", "Reusable water bottle"],
    "schedule": "Arrival at 8:45 AM, safety briefing at 9:00 AM.",
    "accessibility": "Flat paths and volunteer support.",
    "contact": "volunteer@greencity.org"
  }
]
```

#### GET /api/events/{event_id}
Returns one event by ID for the detail page.

Response shape should match the frontend’s event detail fields.

### Dashboard

#### GET /api/dashboard
Returns the data shown on the dashboard, including:
- signed-up event count
- volunteer hours
- pending invites
- upcoming registered events
- available events
- profile summary

Example response:
```json
{
  "stats": {
    "eventsSignedUp": 4,
    "hoursVolunteered": 12,
    "pendingInvites": 2
  },
  "upcomingEvents": [
    {
      "id": 1,
      "title": "Park Cleanup",
      "date": "Saturday, July 12",
      "time": "9:00 AM - 12:00 PM",
      "location": "Riverside Park",
      "status": "registered"
    }
  ],
  "availableEvents": [
    {
      "id": 2,
      "title": "Literacy Workshop",
      "date": "Sunday, July 20",
      "time": "2:00 PM",
      "location": "Library Hall",
      "spotsLeft": 5
    }
  ],
  "profile": {
    "location": "Seattle, WA",
    "availability": "Weekends, Evenings",
    "interests": "Community cleanup, Education, Food assistance"
  }
}
```

### Event registration

#### POST /api/events/{event_id}/register
Registers the authenticated user for an event.

Response:
```json
{
  "message": "Successfully registered for the event",
  "eventId": 1,
  "signedUp": 19
}
```

#### DELETE /api/events/{event_id}/register
Cancels the authenticated user’s registration.

Response:
```json
{
  "message": "Registration canceled",
  "eventId": 1,
  "signedUp": 17
}
```

## 4. Business rules the backend should enforce

- Prevent duplicate registration for the same user/event.
- Reject sign-up if the event is already at capacity.
- Return clear validation errors for missing or invalid signup data.
- Ensure passwords are stored securely with hashing.
- Return 404 for missing events and 401/403 for unauthorized access.

## 5. Suggested implementation approach in Python

A suitable Python backend structure would be:
- FastAPI for routing and request validation
- Pydantic models for request/response schemas
- SQLAlchemy or another ORM for database access
- JWT or session-based authentication

## 6. Suggested next step

The next implementation step would be to create the Python backend project, define the database models above, and expose the endpoints in the order listed here so the frontend can be wired to live data instead of the current static sample data.
