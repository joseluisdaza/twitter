# Services Reference

## Auth Service (port 50051)

Handles user registration, login, and token management.

### RPCs

| Method | Request | Response | Auth Required |
|--------|---------|----------|---------------|
| Register | RegisterRequest | RegisterResponse | No |
| Login | LoginRequest | LoginResponse | No |
| ValidateToken | ValidateTokenRequest | ValidateTokenResponse | No |
| RefreshToken | RefreshTokenRequest | RefreshTokenResponse | No |
| Check | HealthCheckRequest | HealthCheckResponse | No |

## User Service (port 50052)

Manages user profiles and social relationships (follows).

### RPCs

| Method | Request | Response | Auth Required |
|--------|---------|----------|---------------|
| GetUser | GetUserRequest | GetUserResponse | Yes |
| UpdateUser | UpdateUserRequest | UpdateUserResponse | Yes |
| DeleteUser | DeleteUserRequest | DeleteUserResponse | Yes (Admin) |
| ListUsers | ListUsersRequest | ListUsersResponse | Yes (Admin) |
| FollowUser | FollowUserRequest | FollowUserResponse | Yes |
| UnfollowUser | UnfollowUserRequest | UnfollowUserResponse | Yes |
| GetFollowers | GetFollowersRequest | GetFollowersResponse | Yes |
| GetFollowing | GetFollowingRequest | GetFollowingResponse | Yes |
| Check | HealthCheckRequest | HealthCheckResponse | No |

## Tweet Service (port 50053)

Handles tweets, likes, and user timelines.

### RPCs

| Method | Request | Response | Auth Required |
|--------|---------|----------|---------------|
| CreateTweet | CreateTweetRequest | CreateTweetResponse | Yes |
| GetTweet | GetTweetRequest | GetTweetResponse | Yes |
| DeleteTweet | DeleteTweetRequest | DeleteTweetResponse | Yes |
| ListTweets | ListTweetsRequest | ListTweetsResponse | Yes |
| GetUserTweets | GetUserTweetsRequest | GetUserTweetsResponse | Yes |
| LikeTweet | LikeTweetRequest | LikeTweetResponse | Yes |
| UnlikeTweet | UnlikeTweetRequest | UnlikeTweetResponse | Yes |
| GetTimeline | GetTimelineRequest | GetTimelineResponse | Yes |
| Check | HealthCheckRequest | HealthCheckResponse | No |
