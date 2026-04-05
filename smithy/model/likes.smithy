$version: "2"

namespace com.chirp

resource LikeResource {
    identifiers: { chirpId: ChirpId }
    operations: [
        LikeChirp
        UnlikeChirp
    ]
}

// ─── Tipos de Like ────────────────────────────────────────────────────────────
structure Like {
    @required
    chirpId: ChirpId

    @required
    userId: UserId

    @required
    createdAt: Timestamp
}

// ─── LikeChirp ────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/v1/chirps/{chirpId}/likes", code: 201)
operation LikeChirp {
    input: LikeChirpInput
    output: LikeChirpOutput
    errors: [
        NotFoundError
        ConflictError
        ForbiddenError
    ]
}

@input
structure LikeChirpInput {
    @required
    @httpLabel
    chirpId: ChirpId
}

@output
structure LikeChirpOutput {
    @required
    @httpPayload
    like: Like
}

// ─── UnlikeChirp ──────────────────────────────────────────────────────────────
@idempotent
@http(method: "DELETE", uri: "/v1/chirps/{chirpId}/likes", code: 204)
operation UnlikeChirp {
    input: UnlikeChirpInput
    output: UnlikeChirpOutput
    errors: [
        NotFoundError
        ForbiddenError
    ]
}

@input
structure UnlikeChirpInput {
    @required
    @httpLabel
    chirpId: ChirpId
}

@output
structure UnlikeChirpOutput {}
