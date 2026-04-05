$version: "2"

namespace com.chirp

resource UserResource {
    identifiers: { userId: UserId }
    read: GetUser
}

// ─── Tipos de Usuario ─────────────────────────────────────────────────────────
/// Username alfanumérico (3–30 caracteres)
@length(min: 3, max: 30)
@pattern("^[a-zA-Z0-9_]+$")
string Username

/// Nombre de display (1–100 caracteres)
@length(min: 1, max: 100)
string DisplayName

/// Biografía del usuario (0–160 caracteres)
@length(min: 0, max: 160)
string Bio

structure User {
    @required
    userId: UserId

    @required
    username: Username

    @required
    email: Email

    @required
    displayName: DisplayName

    bio: Bio

    avatarUrl: MediaUrl

    @required
    verified: Boolean

    @required
    createdAt: Timestamp
}

list UserList {
    member: User
}

// ─── GetUser ──────────────────────────────────────────────────────────────────
@readonly
@http(method: "GET", uri: "/v1/users/{userId}", code: 200)
operation GetUser {
    input: GetUserInput
    output: GetUserOutput
    errors: [
        NotFoundError
    ]
}

@input
structure GetUserInput {
    @required
    @httpLabel
    userId: UserId
}

@output
structure GetUserOutput {
    @required
    @httpPayload
    user: User
}
