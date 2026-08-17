import os
from datetime import date, datetime, time

import psycopg2
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
app.config["JSON_SORT_KEYS"] = False
# Required for cross-origin session cookies
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True


def get_allowed_origins():
    origins = [
        "http://localhost:5173",
        "https://brave-rock-0c84aef10.7.azurestaticapps.net",
        "https://*.azurestaticapps.net",
    ]
    env_origins = os.getenv("FRONTEND_ORIGIN", "")
    if env_origins:
        for origin in env_origins.split(","):
            cleaned = origin.strip()
            if cleaned:
                origins.append(cleaned)
    return origins


CORS(app, supports_credentials=True, origins=get_allowed_origins())

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "gotong-royong-server.postgres.database.azure.com"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "gotong-royong-db"),
    "user": os.getenv("DB_USER", "grAdmin"),
    "password": os.getenv("DB_PASSWORD", "gr541Admin"),
}

VALID_CATEGORIES = {"cleanup", "education", "food"}


def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    return conn


def get_current_user():
    user_id = session.get("user_id")
    if user_id is None:
        return None

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, first_name, last_name, email, password_hash, street_address, city, state,
                           availability, interests, created_at, updated_at
                    FROM users
                    WHERE id = %s
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
    except Exception:
        return None

    if not row:
        return None

    return normalize_user(row)


def normalize_user(row):
    created_at = row.get("created_at")
    updated_at = row.get("updated_at")

    return {
        "id": row["id"],
        "firstName": row["first_name"],
        "lastName": row["last_name"],
        "email": row["email"],
        "passwordHash": row["password_hash"],
        "locationStreet": row.get("street_address"),
        "locationCity": row.get("city"),
        "locationState": row.get("state"),
        "availability": row.get("availability"),
        "interests": row.get("interests"),
        "createdAt": created_at.isoformat() if created_at else None,
        "updatedAt": updated_at.isoformat() if updated_at else None,
        "location": build_location_display(row),
    }


def build_display_name(user):
    parts = [user.get("firstName"), user.get("lastName")]
    return " ".join([part for part in parts if part]).strip()


def build_location_display(record):
    parts = [record.get("locationStreet") or record.get("street_address"), record.get("locationCity") or record.get("city"), record.get("locationState") or record.get("state")]
    return ", ".join([part for part in parts if part]).strip()


def parse_date(value):
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return datetime.strptime(value, "%Y-%m-%d").date()
    raise ValueError("Invalid date")


def parse_time(value):
    if isinstance(value, time):
        return value
    if isinstance(value, datetime):
        return value.time()
    if isinstance(value, str):
        return datetime.strptime(value, "%H:%M").time()
    raise ValueError("Invalid time")


def format_display_date(value):
    if not value:
        return ""
    if isinstance(value, str):
        return value
    return value.strftime("%A, %B %d")


def format_display_time(value):
    if not value:
        return ""
    if isinstance(value, str):
        return value
    return value.strftime("%I:%M %p").lstrip("0")


def serialize_event(row, signed_up=None, registration_status=None):
    start_date = row.get("start_date")
    end_date = row.get("end_date")
    start_time = row.get("start_time")
    end_time = row.get("end_time")

    if start_date:
        if start_date == end_date:
            date_str = format_display_date(start_date)
        else:
            date_str = f"{format_display_date(start_date)} - {format_display_date(end_date)}"
    else:
        date_str = ""

    if start_time:
        if start_time == end_time:
            time_str = format_display_time(start_time)
        else:
            time_str = f"{format_display_time(start_time)} - {format_display_time(end_time)}"
    else:
        time_str = ""

    return {
        "id": row["id"],
        "title": row["title"],
        "startDate": start_date.strftime("%Y-%m-%d") if start_date else None,
        "endDate": end_date.strftime("%Y-%m-%d") if end_date else None,
        "startTime": start_time.strftime("%H:%M") if start_time else None,
        "endTime": end_time.strftime("%H:%M") if end_time else None,
        "date": date_str,
        "time": time_str,
        "locationStreet": row.get("street_address") or None,
        "locationCity": row.get("city") or None,
        "locationState": row.get("state") or None,
        "location": build_location_display(row),
        "summary": row["summary"],
        "category": row["category"],
        "organizer": row.get("organizer_name") or "",
        "capacity": row["capacity"],
        "signedUp": signed_up if signed_up is not None else 0,
        "description": row.get("description") or "",
        "schedule": row.get("schedule") or "",
        "accessibility": row.get("accessibility") or "",
        "contact": row.get("contact_email") or "",
        "requirements": row.get("requirements") or [],
        "createdBy": row.get("organizer_id") or 0,
        "isRegistered": bool(registration_status and registration_status != "canceled"),
    }


def safe_user_payload(user):
    safe_user = {key: value for key, value in user.items() if key != "passwordHash"}
    safe_user["location"] = build_location_display(user)
    return safe_user


def get_row_value(row, default=None):
    if row is None:
        return default
    if hasattr(row, "get"):
        values = list(row.values())
        if values:
            return values[0]
        return default
    return row[0]


def fetch_next_id(cur, table_name):
    cur.execute(f"SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM {table_name}")
    row = cur.fetchone()
    if row is None:
        return 1
    return get_row_value(row, 1)


def insert_and_return_id(cur, sql, params):
    cur.execute(sql, params)
    row = cur.fetchone()
    if row is None:
        return None
    return get_row_value(row, None)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "database": DB_CONFIG["database"]})


@app.post("/api/auth/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    first_name = (payload.get("firstName") or "").strip()
    last_name = (payload.get("lastName") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirmPassword") or ""
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    availability = (payload.get("availability") or "").strip()
    interests = (payload.get("interests") or "").strip()

    if not first_name or not last_name or not email or not password or not confirm_password:
        return jsonify({"error": "Please provide all required fields."}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return jsonify({"error": "A user with that email already exists."}), 409

                password_hash = generate_password_hash(password)
                user_id = insert_and_return_id(
                    cur,
                    """
                    INSERT INTO users (
                        first_name, last_name, email, password_hash, street_address, city, state,
                        availability, interests, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                    """,
                    (first_name, last_name, email, password_hash, location_street or None, location_city or None, location_state or None, availability or None, interests or None),
                )
                conn.commit()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    session["user_id"] = user_id
    return jsonify({"user": safe_user_payload({
        "id": user_id,
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "passwordHash": password_hash,
        "locationStreet": location_street or None,
        "locationCity": location_city or None,
        "locationState": location_state or None,
        "availability": availability or None,
        "interests": interests or None,
        "location": build_location_display({
            "locationStreet": location_street or None,
            "locationCity": location_city or None,
            "locationState": location_state or None,
        }),
    }), "message": "Account created successfully"}), 201


@app.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Please provide email and password."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, first_name, last_name, email, password_hash, street_address, city, state, availability, interests FROM users WHERE email = %s",
                    (email,),
                )
                row = cur.fetchone()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    session["user_id"] = row["id"]
    return jsonify({"user": safe_user_payload(normalize_user(row)), "message": "Login successful"}), 200


@app.get("/api/users/me")
def get_current_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401
    return jsonify(safe_user_payload(user))


@app.put("/api/users/me")
def update_current_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    availability = (payload.get("availability") or "").strip()
    interests = (payload.get("interests") or "").strip()

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE users
                    SET street_address = %s, city = %s, state = %s, availability = %s, interests = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (location_street or None, location_city or None, location_state or None, availability or None, interests or None, user["id"]),
                )
                conn.commit()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    user["locationStreet"] = location_street or None
    user["locationCity"] = location_city or None
    user["locationState"] = location_state or None
    user["availability"] = availability or None
    user["interests"] = interests or None
    return jsonify({"user": safe_user_payload(user), "message": "Profile updated successfully"})


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
    if not check_password_hash(user.get("passwordHash", ""), current_password):
        return jsonify({"error": "Current password is incorrect."}), 401
    if new_password != confirm_password:
        return jsonify({"error": "New passwords do not match."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (generate_password_hash(new_password), user["id"]),
                )
                conn.commit()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({"message": "Password updated successfully"})


@app.post("/api/auth/logout")
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out successfully"}), 200


@app.post("/api/events")
def create_event():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    start_date = (payload.get("startDate") or "").strip()
    start_time = (payload.get("startTime") or "").strip()
    end_date = (payload.get("endDate") or "").strip()
    end_time = (payload.get("endTime") or "").strip()
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    summary = (payload.get("summary") or "").strip()
    category = (payload.get("category") or "").strip().lower()

    if not title or not start_date or not start_time or not end_date or not end_time or not summary or not category:
        return jsonify({"error": "Please provide title, start date, start time, end date, end time, summary, and category."}), 400
    if not location_street or not location_city or not location_state:
        return jsonify({"error": "Please provide street, city, and state for the event location."}), 400
    if category not in VALID_CATEGORIES:
        return jsonify({"error": "Category must be one of cleanup, education, or food."}), 400

    try:
        parsed_start_date = parse_date(start_date)
        parsed_end_date = parse_date(end_date)
        parsed_start_time = parse_time(start_time)
        parsed_end_time = parse_time(end_time)
    except ValueError:
        return jsonify({"error": "Please provide valid date and time values in YYYY-MM-DD and HH:MM format."}), 400

    capacity = payload.get("capacity", 10)
    description = (payload.get("description") or "").strip()
    schedule = (payload.get("schedule") or "").strip()
    accessibility = (payload.get("accessibility") or "").strip()
    contact = (payload.get("contact") or "").strip() or user["email"]

    try:
        capacity = int(capacity)
    except (TypeError, ValueError):
        return jsonify({"error": "Capacity must be a number."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                event_id = insert_and_return_id(
                    cur,
                    """
                    INSERT INTO events (
                        title, summary, description, category, organizer_id, street_address, city, state,
                        start_date, end_date, start_time, end_time, capacity, schedule, accessibility,
                        contact_email, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                    """,
                    (
                        title,
                        summary,
                        description or None,
                        category,
                        user["id"],
                        location_street,
                        location_city,
                        location_state,
                        parsed_start_date,
                        parsed_end_date,
                        parsed_start_time,
                        parsed_end_time,
                        capacity,
                        schedule or None,
                        accessibility or None,
                        contact or None,
                    ),
                )
                cur.execute(
                    """
                    INSERT INTO event_registrations (event_id, user_id, status, registered_at, updated_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    (event_id, user["id"], "registered"),
                )
                conn.commit()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({"message": "Event created successfully", "event": serialize_event({
        "id": event_id,
        "title": title,
        "summary": summary,
        "description": description,
        "category": category,
        "organizer_id": user["id"],
        "street_address": location_street,
        "city": location_city,
        "state": location_state,
        "start_date": parsed_start_date,
        "end_date": parsed_end_date,
        "start_time": parsed_start_time,
        "end_time": parsed_end_time,
        "capacity": capacity,
        "schedule": schedule,
        "accessibility": accessibility,
        "contact_email": contact,
        "organizer_name": build_display_name(user),
    }, signed_up=1)}), 201


@app.get("/api/events")
def list_events():
    query = (request.args.get("q") or "").strip().lower()
    location_filter = (request.args.get("location") or "").strip().lower()
    category_filter = (request.args.get("category") or "").strip().lower()

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                sql = """
                    SELECT e.id, e.title, e.summary, e.description, e.category, e.organizer_id,
                           e.street_address, e.city, e.state, e.start_date, e.end_date, e.start_time, e.end_time,
                           e.capacity, e.schedule, e.accessibility, e.contact_email,
                           u.first_name AS organizer_first_name, u.last_name AS organizer_last_name,
                           COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'registered'), 0) AS signed_up
                    FROM events e
                    LEFT JOIN users u ON u.id = e.organizer_id
                """
                params = []
                where_clauses = []

                if query:
                    where_clauses.append("(LOWER(e.title) LIKE %s OR LOWER(e.summary) LIKE %s OR LOWER(e.city) LIKE %s OR LOWER(e.state) LIKE %s OR LOWER(e.category) LIKE %s)")
                    pattern = f"%{query}%"
                    params.extend([pattern, pattern, pattern, pattern, pattern])
                if location_filter:
                    where_clauses.append("(LOWER(e.city) LIKE %s OR LOWER(e.state) LIKE %s OR LOWER(e.street_address) LIKE %s)")
                    pattern = f"%{location_filter}%"
                    params.extend([pattern, pattern, pattern])
                if category_filter:
                    where_clauses.append("LOWER(e.category) = %s")
                    params.append(category_filter)

                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)

                sql += " ORDER BY e.id ASC"
                cur.execute(sql, params)
                rows = cur.fetchall()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify([
        serialize_event(
            {
                **row,
                "organizer_name": f"{row['organizer_first_name'] or ''} {row['organizer_last_name'] or ''}".strip(),
            },
            signed_up=row["signed_up"],
        )
        for row in rows
    ])


@app.get("/api/events/created")
def list_created_events():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT e.id, e.title, e.summary, e.description, e.category, e.organizer_id,
                           e.street_address, e.city, e.state, e.start_date, e.end_date, e.start_time, e.end_time,
                           e.capacity, e.schedule, e.accessibility, e.contact_email,
                           u.first_name AS organizer_first_name, u.last_name AS organizer_last_name,
                           COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'registered'), 0) AS signed_up
                    FROM events e
                    LEFT JOIN users u ON u.id = e.organizer_id
                    WHERE e.organizer_id = %s
                    ORDER BY e.id ASC
                    """,
                    (user["id"],),
                )
                rows = cur.fetchall()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify([
        serialize_event(
            {
                **row,
                "organizer_name": f"{row['organizer_first_name'] or ''} {row['organizer_last_name'] or ''}".strip(),
            },
            signed_up=row["signed_up"],
        )
        for row in rows
    ])


@app.get("/api/events/<int:event_id>")
def get_event_detail(event_id):
    user = get_current_user()

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT e.id, e.title, e.summary, e.description, e.category, e.organizer_id,
                           e.street_address, e.city, e.state, e.start_date, e.end_date, e.start_time, e.end_time,
                           e.capacity, e.schedule, e.accessibility, e.contact_email,
                           u.first_name AS organizer_first_name, u.last_name AS organizer_last_name,
                           COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'registered'), 0) AS signed_up
                    FROM events e
                    LEFT JOIN users u ON u.id = e.organizer_id
                    WHERE e.id = %s
                    """,
                    (event_id,),
                )
                row = cur.fetchone()

                registration_status = None
                if user is not None and row:
                    cur.execute(
                        "SELECT status FROM event_registrations WHERE event_id = %s AND user_id = %s ORDER BY id DESC LIMIT 1",
                        (event_id, user["id"]),
                    )
                    reg_row = cur.fetchone()
                    registration_status = reg_row["status"] if reg_row else None
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    if not row:
        return jsonify({"error": "Event not found."}), 404

    return jsonify(serialize_event(
        {
            **row,
            "organizer_name": f"{row['organizer_first_name'] or ''} {row['organizer_last_name'] or ''}".strip(),
        },
        signed_up=row["signed_up"],
        registration_status=registration_status,
    ))


@app.get("/api/events/<int:event_id>/attendees")
def get_event_attendees(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT organizer_id FROM events WHERE id = %s", (event_id,))
                event_row = cur.fetchone()
                if not event_row:
                    return jsonify({"error": "Event not found."}), 404
                if event_row["organizer_id"] != user["id"]:
                    return jsonify({"error": "You are not authorized to view attendees for this event."}), 403

                cur.execute(
                    """
                    SELECT u.id, u.first_name, u.last_name, u.email, u.street_address, u.city, u.state, u.availability, u.interests
                    FROM event_registrations er
                    JOIN users u ON u.id = er.user_id
                    WHERE er.event_id = %s AND er.status = 'registered'
                    ORDER BY er.registered_at ASC
                    """,
                    (event_id,),
                )
                rows = cur.fetchall()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify([
        {
            "id": row["id"],
            "firstName": row["first_name"],
            "lastName": row["last_name"],
            "email": row["email"],
            "location": build_location_display({
                "locationStreet": row["street_address"],
                "locationCity": row["city"],
                "locationState": row["state"],
            }),
            "availability": row["availability"],
            "interests": row["interests"],
        }
        for row in rows
    ])


@app.put("/api/events/<int:event_id>")
def update_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    start_date = (payload.get("startDate") or "").strip()
    start_time = (payload.get("startTime") or "").strip()
    end_date = (payload.get("endDate") or "").strip()
    end_time = (payload.get("endTime") or "").strip()
    location_street = (payload.get("locationStreet") or "").strip()
    location_city = (payload.get("locationCity") or "").strip()
    location_state = (payload.get("locationState") or "").strip()
    summary = (payload.get("summary") or "").strip()
    category = (payload.get("category") or "").strip().lower()
    capacity = payload.get("capacity", 0)
    description = (payload.get("description") or "").strip()
    schedule = (payload.get("schedule") or "").strip()
    accessibility = (payload.get("accessibility") or "").strip()
    contact = (payload.get("contact") or "").strip()

    if not title or not start_date or not start_time or not end_date or not end_time or not summary or not category or not (location_street or location_city or location_state):
        return jsonify({"error": "Please provide title, date, time, location, summary, and category."}), 400
    if category not in VALID_CATEGORIES:
        return jsonify({"error": "Category must be one of cleanup, education, or food."}), 400

    try:
        parsed_start_date = parse_date(start_date)
        parsed_end_date = parse_date(end_date)
        parsed_start_time = parse_time(start_time)
        parsed_end_time = parse_time(end_time)
        capacity = int(capacity)
    except (TypeError, ValueError):
        return jsonify({"error": "Please provide valid values for date, time, and capacity."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT organizer_id FROM events WHERE id = %s", (event_id,))
                event_row = cur.fetchone()
                if not event_row:
                    return jsonify({"error": "Event not found."}), 404
                if event_row[0] != user["id"]:
                    return jsonify({"error": "You are not authorized to edit this event."}), 403

                cur.execute(
                    """
                    UPDATE events
                    SET title = %s,
                        summary = %s,
                        description = %s,
                        category = %s,
                        street_address = %s,
                        city = %s,
                        state = %s,
                        start_date = %s,
                        end_date = %s,
                        start_time = %s,
                        end_time = %s,
                        capacity = %s,
                        schedule = %s,
                        accessibility = %s,
                        contact_email = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (
                        title,
                        summary,
                        description or None,
                        category,
                        location_street,
                        location_city,
                        location_state,
                        parsed_start_date,
                        parsed_end_date,
                        parsed_start_time,
                        parsed_end_time,
                        capacity,
                        schedule or None,
                        accessibility or None,
                        contact or None,
                        event_id,
                    ),
                )
                conn.commit()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({"message": "Event updated successfully"})


@app.delete("/api/events/<int:event_id>")
def delete_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT organizer_id FROM events WHERE id = %s", (event_id,))
                event_row = cur.fetchone()
                if not event_row:
                    return jsonify({"error": "Event not found."}), 404
                if event_row[0] != user["id"]:
                    return jsonify({"error": "You are not authorized to cancel this event."}), 403
                cur.execute("DELETE FROM events WHERE id = %s", (event_id,))
                conn.commit()
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({"message": "Event canceled successfully"})


@app.get("/api/dashboard")
def dashboard():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT e.id, e.title, e.summary, e.description, e.category, e.organizer_id,
                           e.street_address, e.city, e.state, e.start_date, e.end_date, e.start_time, e.end_time,
                           e.capacity, e.schedule, e.accessibility, e.contact_email,
                           u.first_name AS organizer_first_name, u.last_name AS organizer_last_name,
                           COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'registered'), 0) AS signed_up
                    FROM events e
                    LEFT JOIN users u ON u.id = e.organizer_id
                    WHERE e.id IN (SELECT event_id FROM event_registrations WHERE user_id = %s AND status = 'registered')
                    ORDER BY e.id ASC
                    """,
                    (user["id"],),
                )
                upcoming_rows = cur.fetchall()

                cur.execute(
                    """
                    SELECT e.id, e.title, e.summary, e.description, e.category, e.organizer_id,
                           e.street_address, e.city, e.state, e.start_date, e.end_date, e.start_time, e.end_time,
                           e.capacity, e.schedule, e.accessibility, e.contact_email,
                           u.first_name AS organizer_first_name, u.last_name AS organizer_last_name,
                           COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'registered'), 0) AS signed_up
                    FROM events e
                    LEFT JOIN users u ON u.id = e.organizer_id
                    WHERE e.id NOT IN (SELECT event_id FROM event_registrations WHERE user_id = %s AND status = 'registered')
                    ORDER BY e.id ASC
                    """,
                    (user["id"],),
                )
                available_rows = cur.fetchall()

                cur.execute("SELECT COUNT(*) FROM event_registrations WHERE user_id = %s AND status = 'registered'", (user["id"],))
                events_signed_up = get_row_value(cur.fetchone(), 0)

                cur.execute("SELECT COUNT(*) FROM events WHERE organizer_id = %s", (user["id"],))
                events_created = get_row_value(cur.fetchone(), 0)
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({
        "stats": {
            "eventsSignedUp": events_signed_up,
            "hoursVolunteered": 0,
            "eventsCreated": events_created,
        },
        "upcomingEvents": [
            serialize_event(
                {
                    **row,
                    "organizer_name": f"{row['organizer_first_name'] or ''} {row['organizer_last_name'] or ''}".strip(),
                },
                signed_up=row["signed_up"],
            )
            for row in upcoming_rows
        ],
        "availableEvents": [
            serialize_event(
                {
                    **row,
                    "organizer_name": f"{row['organizer_first_name'] or ''} {row['organizer_last_name'] or ''}".strip(),
                },
                signed_up=row["signed_up"],
            )
            for row in available_rows
        ],
        "profile": {
            "location": build_location_display(user) or "Not provided",
            "availability": user.get("availability") or "Not provided",
            "interests": user.get("interests") or "Not provided",
        },
    })


@app.post("/api/events/<int:event_id>/register")
def register_for_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT capacity FROM events WHERE id = %s", (event_id,))
                event_row = cur.fetchone()
                if not event_row:
                    return jsonify({"error": "Event not found."}), 404

                cur.execute(
                    "SELECT COUNT(*) FROM event_registrations WHERE event_id = %s AND status = 'registered'",
                    (event_id,),
                )
                registered_count = get_row_value(cur.fetchone(), 0)
                if registered_count >= event_row["capacity"]:
                    return jsonify({"error": "This event is already at capacity."}), 400

                cur.execute(
                    "SELECT id, status FROM event_registrations WHERE event_id = %s AND user_id = %s ORDER BY id DESC LIMIT 1",
                    (event_id, user["id"]),
                )
                existing = cur.fetchone()
                if existing and existing["status"] == "registered":
                    return jsonify({"error": "You are already registered for this event."}), 409

                if existing:
                    cur.execute(
                        "UPDATE event_registrations SET status = 'registered', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (existing["id"],),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO event_registrations (event_id, user_id, status, registered_at, updated_at)
                        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """,
                        (event_id, user["id"], "registered"),
                    )
                conn.commit()

                cur.execute(
                    "SELECT COUNT(*) FROM event_registrations WHERE event_id = %s AND status = 'registered'",
                    (event_id,),
                )
                signed_up = get_row_value(cur.fetchone(), 0)
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({"message": "Successfully registered", "eventId": event_id, "signedUp": signed_up})


@app.delete("/api/events/<int:event_id>/register")
def cancel_registration(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, status FROM event_registrations WHERE event_id = %s AND user_id = %s ORDER BY id DESC LIMIT 1",
                    (event_id, user["id"]),
                )
                existing = cur.fetchone()
                if not existing:
                    return jsonify({"error": "You are not registered for this event."}), 404

                cur.execute(
                    "UPDATE event_registrations SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (existing["id"],),
                )
                conn.commit()

                cur.execute(
                    "SELECT COUNT(*) FROM event_registrations WHERE event_id = %s AND status = 'registered'",
                    (event_id,),
                )
                signed_up = get_row_value(cur.fetchone(), 0)
    except Exception as exc:
        return jsonify({"error": f"Database error: {exc}"}), 500

    return jsonify({"message": "Registration canceled", "eventId": event_id, "signedUp": signed_up})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
