"""Tweet service gRPC servicer implementation."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import grpc

from generated import tweet_pb2, tweet_pb2_grpc
from services.tweet_service import models as db

MAX_TWEET_LENGTH = 280


def _tweet_to_proto(tweet: dict) -> tweet_pb2.Tweet:
    return tweet_pb2.Tweet(
        tweet_id=tweet.get("tweet_id", ""),
        user_id=tweet.get("user_id", ""),
        username=tweet.get("username", ""),
        content=tweet.get("content", ""),
        likes_count=tweet.get("likes_count", 0),
        retweets_count=tweet.get("retweets_count", 0),
        created_at=tweet.get("created_at", ""),
        is_liked=tweet.get("is_liked", False),
    )


class TweetServicer(tweet_pb2_grpc.TweetServiceServicer):

    def __init__(self, db_path: str = "tweet_service.db"):
        self.db_path = db_path
        db.init_db(db_path)

    def CreateTweet(self, request, context):
        if not request.content or not request.content.strip():
            return tweet_pb2.CreateTweetResponse(success=False, message="Content cannot be empty")
        if len(request.content) > MAX_TWEET_LENGTH:
            return tweet_pb2.CreateTweetResponse(
                success=False, message=f"Tweet exceeds {MAX_TWEET_LENGTH} characters"
            )
        metadata = dict(context.invocation_metadata() or [])
        username = metadata.get("username", request.user_id)
        tweet = db.create_tweet(request.user_id, username, request.content, self.db_path)
        return tweet_pb2.CreateTweetResponse(success=True, message="Created", tweet=_tweet_to_proto(tweet))

    def GetTweet(self, request, context):
        tweet = db.get_tweet_by_id(request.tweet_id, db_path=self.db_path)
        if not tweet:
            return tweet_pb2.GetTweetResponse(success=False, message="Tweet not found")
        return tweet_pb2.GetTweetResponse(success=True, message="OK", tweet=_tweet_to_proto(tweet))

    def DeleteTweet(self, request, context):
        deleted = db.delete_tweet(request.tweet_id, request.user_id, self.db_path)
        if not deleted:
            return tweet_pb2.DeleteTweetResponse(success=False, message="Tweet not found or unauthorized")
        return tweet_pb2.DeleteTweetResponse(success=True, message="Tweet deleted")

    def ListTweets(self, request, context):
        page = request.page if request.page > 0 else 1
        page_size = request.page_size if request.page_size > 0 else 20
        tweets, total = db.list_tweets(page, page_size, db_path=self.db_path)
        return tweet_pb2.ListTweetsResponse(
            success=True, tweets=[_tweet_to_proto(t) for t in tweets], total=total
        )

    def GetUserTweets(self, request, context):
        page = request.page if request.page > 0 else 1
        page_size = request.page_size if request.page_size > 0 else 20
        tweets, total = db.get_user_tweets(request.user_id, page, page_size, db_path=self.db_path)
        return tweet_pb2.GetUserTweetsResponse(
            success=True, tweets=[_tweet_to_proto(t) for t in tweets], total=total
        )

    def LikeTweet(self, request, context):
        tweet = db.get_tweet_by_id(request.tweet_id, db_path=self.db_path)
        if not tweet:
            return tweet_pb2.LikeTweetResponse(success=False, message="Tweet not found")
        result = db.like_tweet(request.tweet_id, request.user_id, self.db_path)
        if not result:
            return tweet_pb2.LikeTweetResponse(success=False, message="Already liked")
        return tweet_pb2.LikeTweetResponse(success=True, message="Liked")

    def UnlikeTweet(self, request, context):
        result = db.unlike_tweet(request.tweet_id, request.user_id, self.db_path)
        if not result:
            return tweet_pb2.UnlikeTweetResponse(success=False, message="Not liked")
        return tweet_pb2.UnlikeTweetResponse(success=True, message="Unliked")

    def GetTimeline(self, request, context):
        page = request.page if request.page > 0 else 1
        page_size = request.page_size if request.page_size > 0 else 20
        tweets = db.get_timeline(request.user_id, page, page_size, self.db_path)
        return tweet_pb2.GetTimelineResponse(success=True, tweets=[_tweet_to_proto(t) for t in tweets])

    def Check(self, request, context):
        return tweet_pb2.HealthCheckResponse(status="SERVING")
