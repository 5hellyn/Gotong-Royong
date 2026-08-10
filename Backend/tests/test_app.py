import importlib.util
import os
import unittest
from unittest.mock import Mock

from psycopg2.extras import RealDictRow

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "app.py")
spec = importlib.util.spec_from_file_location("backend_app", MODULE_PATH)
backend_app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_app)


class NormalizeUserTests(unittest.TestCase):
    def test_normalize_user_handles_missing_timestamps(self):
        row = {
            "id": 7,
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "password_hash": "hash",
            "street_address": "123 Main St",
            "city": "Seattle",
            "state": "WA",
            "availability": "Weekends",
            "interests": "Education",
        }

        normalized = backend_app.normalize_user(row)

        self.assertEqual(normalized["firstName"], "Ada")
        self.assertEqual(normalized["location"], "123 Main St, Seattle, WA")
        self.assertIsNone(normalized["createdAt"])
        self.assertIsNone(normalized["updatedAt"])

    def test_fetch_next_id_supports_real_dict_rows(self):
        cursor = Mock()
        cursor.fetchone.return_value = RealDictRow([("next_id", 4)])

        self.assertEqual(backend_app.fetch_next_id(cursor, "users"), 4)
        cursor.execute.assert_called_once_with("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM users")

    def test_get_row_value_supports_real_dict_rows(self):
        row = RealDictRow([("count", 3)])

        self.assertEqual(backend_app.get_row_value(row), 3)

    def test_insert_and_return_id_reads_generated_id(self):
        cursor = Mock()
        cursor.fetchone.return_value = RealDictRow([("id", 42)])

        result = backend_app.insert_and_return_id(cursor, "INSERT INTO users (email) VALUES (%s) RETURNING id", ("ada@example.com",))

        self.assertEqual(result, 42)
        cursor.execute.assert_called_once_with("INSERT INTO users (email) VALUES (%s) RETURNING id", ("ada@example.com",))

    def test_serialize_event_defaults_requirements_to_empty_list(self):
        event = backend_app.serialize_event({
            "id": 10,
            "title": "Cleanup",
            "summary": "Help",
            "category": "cleanup",
            "organizer_id": 1,
            "street_address": "123 Main",
            "city": "Seattle",
            "state": "WA",
            "start_date": None,
            "end_date": None,
            "start_time": None,
            "end_time": None,
            "capacity": 20,
            "description": "",
            "schedule": "",
            "accessibility": "",
            "contact_email": "",
        })

        self.assertEqual(event["requirements"], [])


if __name__ == "__main__":
    unittest.main()
