$version: "2"

namespace com.chirp

resource FollowResource {
    identifiers: { userId: UserId, followedId: UserId }
    create: FollowUser
    delete: UnfollowUser
}

// ─── Tipos de Follow ──────────────────────────────────────────────────────────
structure Follow {
    @required
    followerId: UserId

    @required
    followedId: UserId

    @required
    createdAt: Timestamp
}

// ─── FollowUser ───────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/v1/users/{userId}/follows", code: 201)
operation FollowUser {
    input: FollowUserInput
    output: FollowUserOutput
    errors: [
        BadRequestError
        NotFoundError
        ConflictError
        ForbiddenError
    ]
}

@input
structure FollowUserInput {
    @required
    @httpLabel
    userId: UserId
}

@output
structure FollowUserOutput {
    @required
    @httpPayload
    follow: Follow
}

// ─── UnfollowUser ─────────────────────────────────────────────────────────────
@idempotent
@http(method: "DELETE", uri: "/v1/users/{userId}/follows/{followedId}", code: 204)
operation UnfollowUser {
    input: UnfollowUserInput
    output: UnfollowUserOutput
    errors: [
        NotFoundError
        ForbiddenError
    ]
}

@input
structure UnfollowUserInput {
    @required
    @httpLabel
    userId: UserId

    @required
    @httpLabel
    followedId: UserId
}

@output
structure UnfollowUserOutput {}

// ─── ListFollowers ────────────────────────────────────────────────────────────
@readonly
@http(method: "GET", uri: "/v1/users/{userId}/followers", code: 200)
operation ListFollowers {
    input: ListFollowersInput
    output: ListFollowersOutput
    errors: [
        NotFoundError
    ]
}

@input
structure ListFollowersInput {
    @required
    @httpLabel
    userId: UserId

    @httpQuery("pageSize")
    pageSize: PageSize

    @httpQuery("nextToken")
    nextToken: NextToken
}

@output
structure ListFollowersOutput {
    @required
    followers: UserList

    nextToken: NextToken
}

// ─── ListFollowing ────────────────────────────────────────────────────────────
@readonly
@http(method: "GET", uri: "/v1/users/{userId}/following", code: 200)
operation ListFollowing {
    input: ListFollowingInput
    output: ListFollowingOutput
    errors: [
        NotFoundError
    ]
}

@input
structure ListFollowingInput {
    @required
    @httpLabel
    userId: UserId

    @httpQuery("pageSize")
    pageSize: PageSize

    @httpQuery("nextToken")
    nextToken: NextToken
}

@output
structure ListFollowingOutput {
    @required
    following: UserList

    nextToken: NextToken
}
