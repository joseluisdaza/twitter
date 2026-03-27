"""Tests for the tweet service."""

import pytest
from unittest.mock import MagicMock


class TestTweetServicer:
    def _get_servicer(self, tweet_db):
        from services.tweet_service.servicer import TweetServicer
        return TweetServicer(db_path=tweet_db)

    def _mock_context(self, username="testuser"):
        ctx = MagicMock()
        ctx.invocation_metadata.return_value = [("username", username)]
        return ctx

    def test_create_tweet(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content="Hello world!"),
            self._mock_context("alice")
        )
        assert resp.success is True
        assert resp.tweet.tweet_id
        assert resp.tweet.content == "Hello world!"

    def test_create_tweet_too_long(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content="x" * 281),
            self._mock_context()
        )
        assert resp.success is False

    def test_create_tweet_empty(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content=""),
            self._mock_context()
        )
        assert resp.success is False

    def test_get_tweet(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        create_resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content="Test tweet"),
            self._mock_context("alice")
        )
        get_resp = servicer.GetTweet(
            tweet_pb2.GetTweetRequest(tweet_id=create_resp.tweet.tweet_id), MagicMock()
        )
        assert get_resp.success is True
        assert get_resp.tweet.content == "Test tweet"

    def test_get_tweet_not_found(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        resp = servicer.GetTweet(tweet_pb2.GetTweetRequest(tweet_id="nonexistent"), MagicMock())
        assert resp.success is False

    def test_delete_tweet(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        create_resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content="To delete"),
            self._mock_context("alice")
        )
        del_resp = servicer.DeleteTweet(
            tweet_pb2.DeleteTweetRequest(tweet_id=create_resp.tweet.tweet_id, user_id="u1"),
            MagicMock()
        )
        assert del_resp.success is True

    def test_delete_tweet_wrong_user(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        create_resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content="Mine"),
            self._mock_context("alice")
        )
        del_resp = servicer.DeleteTweet(
            tweet_pb2.DeleteTweetRequest(tweet_id=create_resp.tweet.tweet_id, user_id="u2"),
            MagicMock()
        )
        assert del_resp.success is False

    def test_like_unlike_tweet(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        create_resp = servicer.CreateTweet(
            tweet_pb2.CreateTweetRequest(user_id="u1", content="Like me"),
            self._mock_context("alice")
        )
        tweet_id = create_resp.tweet.tweet_id

        like_resp = servicer.LikeTweet(tweet_pb2.LikeTweetRequest(tweet_id=tweet_id, user_id="u2"), MagicMock())
        assert like_resp.success is True

        dup_resp = servicer.LikeTweet(tweet_pb2.LikeTweetRequest(tweet_id=tweet_id, user_id="u2"), MagicMock())
        assert dup_resp.success is False

        unlike_resp = servicer.UnlikeTweet(tweet_pb2.UnlikeTweetRequest(tweet_id=tweet_id, user_id="u2"), MagicMock())
        assert unlike_resp.success is True

    def test_list_tweets(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        for i in range(3):
            servicer.CreateTweet(
                tweet_pb2.CreateTweetRequest(user_id="u1", content=f"Tweet {i}"),
                self._mock_context("alice")
            )
        resp = servicer.ListTweets(tweet_pb2.ListTweetsRequest(page=1, page_size=10), MagicMock())
        assert resp.success is True
        assert len(resp.tweets) == 3
        assert resp.total == 3

    def test_health_check(self, tweet_db):
        from generated import tweet_pb2
        servicer = self._get_servicer(tweet_db)
        resp = servicer.Check(tweet_pb2.HealthCheckRequest(service="tweet"), MagicMock())
        assert resp.status == "SERVING"
