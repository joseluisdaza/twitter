"""Shared test fixtures."""

import os
import sys
import pytest

# Ensure project root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def auth_db(tmp_path):
    return str(tmp_path / "auth_test.db")


@pytest.fixture
def user_db(tmp_path):
    return str(tmp_path / "user_test.db")


@pytest.fixture
def tweet_db(tmp_path):
    return str(tmp_path / "tweet_test.db")
