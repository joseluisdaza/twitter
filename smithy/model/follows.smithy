$version: "2"

namespace com.chirp.follows

use com.chirp.common#ConflictError
use com.chirp.common#DateTime
use com.chirp.common#InternalServerError
use com.chirp.common#NotFoundError
use com.chirp.common#PageSize
use com.chirp.common#PaginationToken
use com.chirp.common#UUID
use com.chirp.common#UnauthorizedError
use com.chirp.common#Username

/// ============================================================================
/// SEGUIR A UN USUARIO
/// ============================================================================
/// Crea una relación de seguimiento en chirp-follows (followerId + followedId)
/// También incrementa followingCount del seguidor y followersCount del seguido
@http(method: "POST", uri: "/users/{userId}/follow")
operation FollowUser {
    input: FollowUserInput
    output: FollowUserOutput
    errors: [
        NotFoundError
        ConflictError
        UnauthorizedError
        InternalServerError
    ]
}

structure FollowUserInput {
    /// ID del usuario a seguir (followedId en chirp-follows)
    @required
    @httpLabel
    userId: UUID
}

structure FollowUserOutput {
    @required
    message: String = "User followed successfully"

    @required
    follow: Follow
}

/// ============================================================================
/// DEJAR DE SEGUIR A UN USUARIO
/// ============================================================================
/// Elimina la relación de seguimiento de chirp-follows
/// También decrementa followingCount del seguidor y followersCount del seguido
@idempotent
@http(method: "DELETE", uri: "/users/{userId}/follow")
operation UnfollowUser {
    input: UnfollowUserInput
    output: UnfollowUserOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure UnfollowUserInput {
    /// ID del usuario a dejar de seguir (followedId en chirp-follows)
    @required
    @httpLabel
    userId: UUID
}

structure UnfollowUserOutput {
    @required
    message: String = "User unfollowed successfully"
}

/// ============================================================================
/// OBTENER SEGUIDORES DE UN USUARIO
/// ============================================================================
/// Lista los seguidores de un usuario usando el GSI followedId-followerId-index
@readonly
@http(method: "GET", uri: "/users/{userId}/followers")
operation GetFollowers {
    input: GetFollowersInput
    output: GetFollowersOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetFollowersInput {
    @required
    @httpLabel
    userId: UUID

    @httpQuery("limit")
    limit: PageSize

    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetFollowersOutput {
    @required
    followers: FollowList

    nextToken: PaginationToken
}

/// ============================================================================
/// OBTENER USUARIOS QUE SIGUE UN USUARIO
/// ============================================================================
/// Lista los usuarios que sigue un usuario (PK = followerId en chirp-follows)
@readonly
@http(method: "GET", uri: "/users/{userId}/following")
operation GetFollowing {
    input: GetFollowingInput
    output: GetFollowingOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetFollowingInput {
    @required
    @httpLabel
    userId: UUID

    @httpQuery("limit")
    limit: PageSize

    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetFollowingOutput {
    @required
    following: FollowList

    nextToken: PaginationToken
}

/// ============================================================================
/// ESTRUCTURA: Follow
/// ============================================================================
/// Representa una relación de seguimiento en chirp-follows
/// PK: followerId, SK: followedId
structure Follow {
    /// ID del usuario que sigue (PK de chirp-follows)
    @required
    followerId: UUID

    /// ID del usuario seguido (SK de chirp-follows)
    @required
    followedId: UUID

    /// Username del usuario seguido (desnormalizado para performance)
    @required
    followedUsername: Username

    /// Username del seguidor (desnormalizado para performance)
    @required
    followerUsername: Username

    /// Fecha en que se inició el seguimiento
    @required
    createdAt: DateTime
}

list FollowList {
    member: Follow
}
