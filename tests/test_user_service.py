"""Tests for the user service."""

import pytest
from unittest.mock import MagicMock


class TestUserServicer:
    def _get_servicer(self, user_db):
        from services.user_service.servicer import UserServicer
        return UserServicer(db_path=user_db)

    def _create_user(self, user_db, user_id="user-1", username="testuser"):
        from services.user_service.models import create_user, init_db
        init_db(user_db)
        return create_user(user_id, username, f"{username}@example.com", db_path=user_db)

    def test_get_user_not_found(self, user_db):
        from generated import user_pb2
        servicer = self._get_servicer(user_db)
        resp = servicer.GetUser(user_pb2.GetUserRequest(user_id="nonexistent"), MagicMock())
        assert resp.success is False

    def test_get_user_found(self, user_db):
        from generated import user_pb2
        self._create_user(user_db, "u1", "alice")
        servicer = self._get_servicer(user_db)
        resp = servicer.GetUser(user_pb2.GetUserRequest(user_id="u1"), MagicMock())
        assert resp.success is True
        assert resp.user.username == "alice"

    def test_update_user(self, user_db):
        from generated import user_pb2
        self._create_user(user_db, "u2", "bob")
        servicer = self._get_servicer(user_db)
        resp = servicer.UpdateUser(
            user_pb2.UpdateUserRequest(user_id="u2", bio="Hello world"), MagicMock()
        )
        assert resp.success is True
        assert resp.user.bio == "Hello world"

    def test_follow_unfollow(self, user_db):
        from generated import user_pb2
        from services.user_service.models import create_user, init_db
        init_db(user_db)
        create_user("u3", "carol", "carol@example.com", db_path=user_db)
        create_user("u4", "dave", "dave@example.com", db_path=user_db)
        servicer = self._get_servicer(user_db)

        follow_resp = servicer.FollowUser(
            user_pb2.FollowUserRequest(follower_id="u3", followee_id="u4"), MagicMock()
        )
        assert follow_resp.success is True

        followers_resp = servicer.GetFollowers(user_pb2.GetFollowersRequest(user_id="u4"), MagicMock())
        assert len(followers_resp.users) == 1
        assert followers_resp.users[0].username == "carol"

        unfollow_resp = servicer.UnfollowUser(
            user_pb2.UnfollowUserRequest(follower_id="u3", followee_id="u4"), MagicMock()
        )
        assert unfollow_resp.success is True

    def test_cannot_follow_self(self, user_db):
        from generated import user_pb2
        self._create_user(user_db, "u5", "eve")
        servicer = self._get_servicer(user_db)
        resp = servicer.FollowUser(
            user_pb2.FollowUserRequest(follower_id="u5", followee_id="u5"), MagicMock()
        )
        assert resp.success is False

    def test_health_check(self, user_db):
        from generated import user_pb2
        servicer = self._get_servicer(user_db)
        resp = servicer.Check(user_pb2.HealthCheckRequest(service="user"), MagicMock())
        assert resp.status == "SERVING"
