import re

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.config["JSON_SORT_KEYS"] = False


EVENTS = [
    {
        "id": "river-cleanup",
        "title": "River Cleanup",
        "date": "Saturday, July 12",
        "time": "9:00 AM - 12:00 PM",
        "location": "Waterfront Park",
        "summary": "Join neighbors to clean the riverfront and protect wildlife.",
        "category": "cleanup",
        "organizer": "Green City Volunteers",
        "capacity": 25,
        "signedUp": 18,
        "description": "Volunteers will collect trash, remove invasive plants, and install new signage along the waterfront trail.",
        "requirements": ["Closed-toe shoes", "Reusable water bottle", "Sun protection"],
        "schedule": "Arrival at 8:45 AM, safety briefing at 9:00 AM.",
        "accessibility": "Flat paths and volunteer support.",
        "contact": "volunteer@greencity.org",
        "createdBy": 0,
    },
    {
        "id": "food-bank-sort",
        "title": "Food Bank Sort",
        "date": "Monday, July 14",
        "time": "3:00 PM - 6:00 PM",
        "location": "Northside Warehouse",
        "summary": "Organize food donations and prepare kits for families.",
        "category": "food",
        "organizer": "Harvest Helpers",
        "capacity": 30,
        "signedUp": 22,
        "description": "Help sort donated food, assemble packages, and prepare deliveries for local families in need.",
        "requirements": ["Comfortable clothing", "Face mask if needed", "Positive attitude"],
        "schedule": "Check-in at 2:45 PM, team assignment at 3:00 PM.",
        "accessibility": "Ground-floor work area with wide aisles.",
        "contact": "info@harvesthelpers.org",
        "createdBy": 0,
    },
    {
        "id": "reading-buddy-session",
        "title": "Reading Buddy Session",
        "date": "Thursday, July 17",
        "time": "5:30 PM - 7:00 PM",
        "location": "Bellevue Library",
        "summary": "Support children with reading practice.",
        "category": "education",
        "organizer": "Literacy Link",
        "capacity": 15,
        "signedUp": 10,
        "description": "Work one-on-one with young readers to build confidence and fluency.",
        "requirements": ["Patient attitude", "Love of reading"],
        "schedule": "Registration at 5:15 PM, story time at 5:30 PM.",
        "accessibility": "Quiet study room with comfortable seating.",
        "contact": "contact@literacylink.org",
        "createdBy": 0,
    },
]

USERS = []
REGISTRATIONS = []


def get_current_user():
    user_id = app.config.get("current_user_id")
    if user_id is None:
        return None
    for user in USERS:
        if user["id"] == user_id:
            return user
    return None


def serialize_event(event):
    def fmt_date(iso):
        try:
            d = datetime.strptime(iso, "%Y-%m-%d")
            return f"{d.strftime('%A')}, {d.strftime('%B')} {d.day}"
        except Exception:
            return iso

    def fmt_time(t):
        try:
            dt = datetime.strptime(t, "%H:%M")
            s = dt.strftime("%I:%M %p")
            return s.lstrip('0')
        except Exception:
            return t

    # Prefer structured start/end fields when available
    if event.get("startDate"):
        sd = event.get("startDate")
        ed = event.get("endDate") or sd
        if sd == ed:
            date_str = fmt_date(sd)
        else:
            date_str = f"{fmt_date(sd)} - {fmt_date(ed)}"
    else:
        date_str = event.get("date")

    if event.get("startTime"):
        st = event.get("startTime")
        et = event.get("endTime") or st
        time_str = f"{fmt_time(st)} - {fmt_time(et)}"
    else:
        time_str = event.get("time")

    # build a user-facing location string preferring the combined `location` but falling back to structured parts
    loc = event.get("location") or ""
    if not loc:
        parts = [event.get("locationStreet"), event.get("locationCity"), event.get("locationState")]
        loc = ", ".join([p for p in parts if p])

    return {
        "id": event["id"],
        "title": event["title"],
        "date": date_str,
        "time": time_str,
        "location": loc,
        "summary": event["summary"],
        "category": event["category"],
        "organizer": event["organizer"],
        "capacity": event["capacity"],
        "signedUp": event["signedUp"],
        "description": event["description"],
        "requirements": event["requirements"],
        "schedule": event["schedule"],
        "accessibility": event["accessibility"],
        "contact": event["contact"],
        "createdBy": event.get("createdBy", 0),
    }


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/auth/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    first_name = (payload.get("firstName") or "").strip()
    last_name = (payload.get("lastName") or "").strip()
    full_name = f"{first_name} {last_name}".strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirmPassword") or ""
    # accept structured location fields from signup
    location = (payload.get("location") or "").strip()
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    availability = (payload.get("availability") or "").strip()
    interests = (payload.get("interests") or "").strip()
    if not first_name or not last_name or not email or not password or not confirm_password:
        return jsonify({"error": "Please provide all required fields."}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    if any(user["email"].lower() == email for user in USERS):
        return jsonify({"error": "A user with that email already exists."}), 409

    user = {
        "id": len(USERS) + 1,
        "firstName": first_name,
        "lastName": last_name,
        "fullName": full_name,
        "email": email,
        "password": password,
        # store structured parts and combined location for compatibility
        "locationStreet": location_street or None,
        "locationCity": location_city or None,
        "locationState": location_state or None,
        "location": (location_street + (", " + location_city if location_city else "") + (", " + location_state if location_state else "")) if (location_street or location_city or location_state) else location,
        "availability": availability,
        "interests": interests,
    }
    USERS.append(user)
    app.config["current_user_id"] = user["id"]

    safe_user = {k: v for k, v in user.items() if k != "password"}
    return jsonify({"user": safe_user, "message": "Account created successfully"}), 201


@app.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Please provide email and password."}), 400

    user = next((u for u in USERS if u["email"].lower() == email), None)
    if not user or user.get("password") != password:
        return jsonify({"error": "Invalid email or password."}), 401

    app.config["current_user_id"] = user["id"]
    safe_user = {k: v for k, v in user.items() if k != "password"}
    return jsonify({"user": safe_user, "message": "Login successful"}), 200


@app.get("/api/users/me")
def get_current_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    # Ensure returned user includes structured location fields and a combined `location` string
    safe_user = {k: v for k, v in user.items() if k != "password"}
    # Build combined location if missing
    loc = safe_user.get("location") or ""
    if not loc:
        parts = [safe_user.get("locationStreet"), safe_user.get("locationCity"), safe_user.get("locationState")]
        combined = ", ".join([p for p in parts if p])
        if combined:
            safe_user["location"] = combined

    return jsonify(safe_user)


@app.put("/api/users/me")
def update_current_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    location = (payload.get("location") or "").strip()
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    availability = (payload.get("availability") or "").strip()
    interests = (payload.get("interests") or "").strip()

    # Update allowed fields; store structured parts and a combined `location` for compatibility
    if location_street or location_city or location_state:
        user["locationStreet"] = location_street or None
        user["locationCity"] = location_city or None
        user["locationState"] = location_state or None
        user["location"] = (
            (location_street + (", " + location_city if location_city else "") + (", " + location_state if location_state else ""))
            if (location_street or location_city or location_state)
            else location
        )
    else:
        user["location"] = location

    user["availability"] = availability
    user["interests"] = interests

    safe_user = {k: v for k, v in user.items() if k != "password"}
    return jsonify({"user": safe_user, "message": "Profile updated successfully"})


@app.post("/api/users/me/password")
def change_current_user_password():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    current_password = payload.get("currentPassword") or ""
    new_password = payload.get("newPassword") or ""
    confirm_password = payload.get("confirmPassword") or ""

    if not current_password or not new_password or not confirm_password:
        return jsonify({"error": "Please provide current and new password fields."}), 400

    if current_password != user.get("password"):
        return jsonify({"error": "Current password is incorrect."}), 401

    if new_password != confirm_password:
        return jsonify({"error": "New passwords do not match."}), 400

    user["password"] = new_password
    return jsonify({"message": "Password updated successfully"})


@app.post("/api/auth/logout")
def logout():
    app.config["current_user_id"] = None
    return jsonify({"message": "Logged out successfully"}), 200


@app.post("/api/events")
def create_event():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    date = (payload.get("date") or "").strip()
    time = (payload.get("time") or "").strip()
    # Accept either a combined location string or structured street/city/state fields
    location = (payload.get("location") or "").strip()
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    summary = (payload.get("summary") or "").strip()
    category = (payload.get("category") or "").strip()

    if not title or not date or not time or not summary or not category:
        return jsonify({"error": "Please provide title, date, time, location, summary, and category."}), 400

    organizer = (payload.get("organizer") or user.get("fullName") or user.get("email") or "").strip()
    capacity = payload.get("capacity", 10)
    description = (payload.get("description") or "").strip()
    requirements = payload.get("requirements") or []
    schedule = (payload.get("schedule") or "").strip()
    accessibility = (payload.get("accessibility") or "").strip()
    contact = (payload.get("contact") or "").strip()
    start_date = (payload.get("startDate") or "").strip()
    start_time = (payload.get("startTime") or "").strip()
    end_date = (payload.get("endDate") or "").strip()
    end_time = (payload.get("endTime") or "").strip()

    if isinstance(requirements, str):
        requirements = [requirements]
    if not isinstance(requirements, list):
        return jsonify({"error": "Requirements must be a list."}), 400

    try:
        capacity = int(capacity)
    except (TypeError, ValueError):
        return jsonify({"error": "Capacity must be a number."}), 400

    base_id = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "event"
    event_id = base_id
    counter = 1
    while any(existing_event["id"] == event_id for existing_event in EVENTS):
        event_id = f"{base_id}-{counter}"
        counter += 1

    event = {
        "id": event_id,
        "title": title,
        # store structured values if provided
        "startDate": start_date or None,
        "endDate": end_date or None,
        "startTime": start_time or None,
        "endTime": end_time or None,
        "date": date,
        "time": time,
        # prefer structured fields when provided, but also keep a combined `location` for compatibility
        "locationStreet": location_street or None,
        "locationCity": location_city or None,
        "locationState": location_state or None,
        "location": (
            (location_street + (", " + location_city if location_city else "") + (", " + location_state if location_state else ""))
            if location_street or location_city or location_state
            else location
        ),
        "summary": summary,
        "category": category,
        "organizer": organizer,
        "capacity": capacity,
        "signedUp": 0,
        "description": description,
        "requirements": requirements,
        "schedule": schedule,
        "accessibility": accessibility,
        "contact": contact,
        "createdBy": user["id"],
    }
    EVENTS.append(event)

    # Automatically register the event creator
    REGISTRATIONS.append(
        {
            "id": len(REGISTRATIONS) + 1,
            "user_id": user["id"],
            "event_id": event_id,
            "status": "registered",
        }
    )
    event["signedUp"] = max(1, event.get("signedUp", 0))

    return jsonify({"message": "Event created successfully", "event": serialize_event(event)}), 201


@app.get("/api/events")
def list_events():
    query = (request.args.get("q") or "").strip().lower()
    location_filter = (request.args.get("location") or "").strip().lower()
    category_filter = (request.args.get("category") or "").strip().lower()

    filtered_events = []
    for event in EVENTS:
        if query:
            searchable_text = " ".join(
                [event["title"], event["summary"], event["location"], event["category"]]
            ).lower()
            if query not in searchable_text:
                continue

        if location_filter and location_filter not in event["location"].lower():
            continue

        if category_filter and event["category"].lower() != category_filter:
            continue

        filtered_events.append(serialize_event(event))

    return jsonify(filtered_events)


@app.get("/api/events/created")
def list_created_events():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    created_events = [serialize_event(event) for event in EVENTS if event.get("createdBy") == user["id"]]
    return jsonify(created_events)


@app.get("/api/events/<event_id>")
def get_event_detail(event_id):
    user = get_current_user()
    event = next((item for item in EVENTS if item["id"] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found."}), 404

    serialized = serialize_event(event)
    if user is not None:
        registered = any(
            reg["user_id"] == user["id"] and reg["event_id"] == event_id
            for reg in REGISTRATIONS
        )
        serialized["isRegistered"] = registered

    return jsonify(serialized)


@app.get("/api/events/<event_id>/attendees")
def get_event_attendees(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    event = next((item for item in EVENTS if item["id"] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found."}), 404

    # Only the event creator may view attendee profiles
    if event.get("createdBy") != user["id"]:
        return jsonify({"error": "You are not authorized to view attendees for this event."}), 403

    attendee_regs = [r for r in REGISTRATIONS if r["event_id"] == event_id]
    attendees = []
    for reg in attendee_regs:
        u = next((uu for uu in USERS if uu["id"] == reg["user_id"]), None)
        if u:
            safe = {k: v for k, v in u.items() if k != "password"}
            attendees.append(safe)

    return jsonify(attendees)


@app.put("/api/events/<event_id>")
def update_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    event = next((item for item in EVENTS if item["id"] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found."}), 404

    if event.get("createdBy") != user["id"]:
        return jsonify({"error": "You are not authorized to edit this event."}), 403

    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    date = (payload.get("date") or "").strip()
    time = (payload.get("time") or "").strip()
    start_date = (payload.get("startDate") or "").strip()
    start_time = (payload.get("startTime") or "").strip()
    end_date = (payload.get("endDate") or "").strip()
    end_time = (payload.get("endTime") or "").strip()
    location = (payload.get("location") or "").strip()
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    summary = (payload.get("summary") or "").strip()
    category = (payload.get("category") or "").strip()
    organizer = (payload.get("organizer") or event.get("organizer") or "").strip()
    capacity = payload.get("capacity", event.get("capacity", 0))
    description = (payload.get("description") or "").strip()
    requirements = payload.get("requirements") or event.get("requirements", [])
    schedule = (payload.get("schedule") or "").strip()
    accessibility = (payload.get("accessibility") or "").strip()
    contact = (payload.get("contact") or "").strip()

    # require either a combined location string or structured fields
    if not title or not date or not time or not summary or not category or not (location or location_street or location_city or location_state):
        return jsonify({"error": "Please provide title, date, time, location (or structured address), summary, and category."}), 400

    if isinstance(requirements, str):
        requirements = [requirements]
    if not isinstance(requirements, list):
        return jsonify({"error": "Requirements must be a list."}), 400

    try:
        capacity = int(capacity)
    except (TypeError, ValueError):
        return jsonify({"error": "Capacity must be a number."}), 400

    event.update({
        "title": title,
        "startDate": start_date or event.get("startDate"),
        "endDate": end_date or event.get("endDate"),
        "startTime": start_time or event.get("startTime"),
        "endTime": end_time or event.get("endTime"),
        "date": date,
        "time": time,
        "locationStreet": location_street or event.get("locationStreet"),
        "locationCity": location_city or event.get("locationCity"),
        "locationState": location_state or event.get("locationState"),
        "location": (
            (location_street + (", " + location_city if location_city else "") + (", " + location_state if location_state else ""))
            if (location_street or location_city or location_state)
            else location
        ),
        "summary": summary,
        "category": category,
        "organizer": organizer,
        "capacity": capacity,
        "description": description,
        "requirements": requirements,
        "schedule": schedule,
        "accessibility": accessibility,
        "contact": contact,
    })

    return jsonify({"message": "Event updated successfully", "event": serialize_event(event)})


@app.delete("/api/events/<event_id>")
def delete_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    event = next((item for item in EVENTS if item["id"] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found."}), 404

    if event.get("createdBy") != user["id"]:
        return jsonify({"error": "You are not authorized to cancel this event."}), 403

    global REGISTRATIONS
    REGISTRATIONS = [reg for reg in REGISTRATIONS if reg["event_id"] != event_id]
    EVENTS.remove(event)

    return jsonify({"message": "Event canceled successfully"})


@app.get("/api/dashboard")
def dashboard():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    user_registrations = [r for r in REGISTRATIONS if r["user_id"] == user["id"]]
    registered_event_ids = {reg["event_id"] for reg in user_registrations}

    upcoming_events = [serialize_event(event) for event in EVENTS if event["id"] in registered_event_ids]
    available_events = [serialize_event(event) for event in EVENTS if event["id"] not in registered_event_ids]

    events_created = [event for event in EVENTS if event.get("createdBy") == user["id"]]

    return jsonify(
        {
            "stats": {
                "eventsSignedUp": len(upcoming_events),
                "hoursVolunteered": 0,
                "eventsCreated": len(events_created),
            },
            "upcomingEvents": upcoming_events,
            "availableEvents": available_events,
            "profile": {
                "location": user.get("location") or "Not provided",
                "availability": user.get("availability") or "Not provided",
                "interests": user.get("interests") or "Not provided",
            },
        }
    )


@app.post("/api/events/<event_id>/register")
def register_for_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    event = next((item for item in EVENTS if item["id"] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found."}), 404

    if any(reg["user_id"] == user["id"] and reg["event_id"] == event_id for reg in REGISTRATIONS):
        return jsonify({"error": "You are already registered for this event."}), 409

    if event["signedUp"] >= event["capacity"]:
        return jsonify({"error": "This event is already at capacity."}), 400

    event["signedUp"] += 1
    REGISTRATIONS.append(
        {
            "id": len(REGISTRATIONS) + 1,
            "user_id": user["id"],
            "event_id": event_id,
            "status": "registered",
        }
    )

    return jsonify({"message": "Successfully registered", "eventId": event_id, "signedUp": event["signedUp"]})


@app.delete("/api/events/<event_id>/register")
def cancel_registration(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    event = next((item for item in EVENTS if item["id"] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found."}), 404

    registration = next(
        (reg for reg in REGISTRATIONS if reg["user_id"] == user["id"] and reg["event_id"] == event_id),
        None,
    )
    if not registration:
        return jsonify({"error": "You are not registered for this event."}), 404

    event["signedUp"] = max(0, event["signedUp"] - 1)
    REGISTRATIONS.remove(registration)

    return jsonify({"message": "Registration canceled", "eventId": event_id, "signedUp": event["signedUp"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
