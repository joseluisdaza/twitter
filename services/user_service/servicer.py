"""User service gRPC servicer implementation."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import grpc

from generated import user_pb2, user_pb2_grpc
from services.user_service import models as db


def _user_to_proto(user: dict) -> user_pb2.User:
    return user_pb2.User(
        user_id=user.get("user_id", ""),
        username=user.get("username", ""),
        email=user.get("email", ""),
        bio=user.get("bio", ""),
        profile_picture=user.get("profile_picture", ""),
        followers_count=user.get("followers_count", 0),
        following_count=user.get("following_count", 0),
        created_at=user.get("created_at", ""),
        role=user.get("role", "USER"),
    )


class UserServicer(user_pb2_grpc.UserServiceServicer):

    def __init__(self, db_path: str = "user_service.db"):
        self.db_path = db_path
        db.init_db(db_path)

    def GetUser(self, request, context):
        user = db.get_user_by_id(request.user_id, self.db_path)
        if not user:
            return user_pb2.GetUserResponse(success=False, message="User not found")
        return user_pb2.GetUserResponse(success=True, message="OK", user=_user_to_proto(user))

    def UpdateUser(self, request, context):
        user = db.update_user(
            request.user_id,
            bio=request.bio if request.bio else None,
            profile_picture=request.profile_picture if request.profile_picture else None,
            db_path=self.db_path,
        )
        if not user:
            return user_pb2.UpdateUserResponse(success=False, message="User not found")
        return user_pb2.UpdateUserResponse(success=True, message="Updated", user=_user_to_proto(user))

    def DeleteUser(self, request, context):
        deleted = db.delete_user(request.user_id, self.db_path)
        if not deleted:
            return user_pb2.DeleteUserResponse(success=False, message="User not found")
        return user_pb2.DeleteUserResponse(success=True, message="User deleted")

    def ListUsers(self, request, context):
        page = request.page if request.page > 0 else 1
        page_size = request.page_size if request.page_size > 0 else 20
        users, total = db.list_users(page, page_size, self.db_path)
        return user_pb2.ListUsersResponse(
            success=True, users=[_user_to_proto(u) for u in users], total=total
        )

    def FollowUser(self, request, context):
        if request.follower_id == request.followee_id:
            return user_pb2.FollowUserResponse(success=False, message="Cannot follow yourself")
        if not db.get_user_by_id(request.followee_id, self.db_path):
            return user_pb2.FollowUserResponse(success=False, message="User to follow not found")
        result = db.follow_user(request.follower_id, request.followee_id, self.db_path)
        if not result:
            return user_pb2.FollowUserResponse(success=False, message="Already following")
        return user_pb2.FollowUserResponse(success=True, message="Followed successfully")

    def UnfollowUser(self, request, context):
        result = db.unfollow_user(request.follower_id, request.followee_id, self.db_path)
        if not result:
            return user_pb2.UnfollowUserResponse(success=False, message="Not following")
        return user_pb2.UnfollowUserResponse(success=True, message="Unfollowed successfully")

    def GetFollowers(self, request, context):
        followers = db.get_followers(request.user_id, self.db_path)
        return user_pb2.GetFollowersResponse(success=True, users=[_user_to_proto(u) for u in followers])

    def GetFollowing(self, request, context):
        following = db.get_following(request.user_id, self.db_path)
        return user_pb2.GetFollowingResponse(success=True, users=[_user_to_proto(u) for u in following])

    def Check(self, request, context):
        return user_pb2.HealthCheckResponse(status="SERVING")
