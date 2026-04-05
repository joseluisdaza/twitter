$version: "2"

namespace com.chirp

resource ChirpResource {
    identifiers: { chirpId: ChirpId }
    create: CreateChirp
    read: GetChirp
    delete: DeleteChirp
    list: ListChirps
    resources: [
        LikeResource
        CommentResource
    ]
}

// ─── Tipos de Chirp ───────────────────────────────────────────────────────────
/// Contenido de un chirp (1–280 caracteres)
@length(min: 1, max: 280)
string ChirpContent

/// Estructura principal de un Chirp
structure Chirp {
    @required
    chirpId: ChirpId

    @required
    userId: UserId

    @required
    content: ChirpContent

    mediaUrls: MediaUrlList

    @required
    likesCount: Integer

    @required
    repostsCount: Integer

    /// Referencia al chirp padre (para reposts/replies)
    parentChirpId: ChirpId

    @required
    createdAt: Timestamp
}

list ChirpList {
    member: Chirp
}

// ─── CreateChirp ──────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/v1/chirps", code: 201)
operation CreateChirp {
    input: CreateChirpInput
    output: CreateChirpOutput
    errors: [
        BadRequestError
    ]
}

@input
structure CreateChirpInput {
    @required
    content: ChirpContent

    mediaUrls: MediaUrlList

    /// Para reposts o replies
    parentChirpId: ChirpId
}

@output
structure CreateChirpOutput {
    @required
    @httpPayload
    chirp: Chirp
}

// ─── GetChirp ─────────────────────────────────────────────────────────────────
@readonly
@http(method: "GET", uri: "/v1/chirps/{chirpId}", code: 200)
operation GetChirp {
    input: GetChirpInput
    output: GetChirpOutput
    errors: [
        NotFoundError
    ]
}

@input
structure GetChirpInput {
    @required
    @httpLabel
    chirpId: ChirpId
}

@output
structure GetChirpOutput {
    @required
    @httpPayload
    chirp: Chirp
}

// ─── DeleteChirp ──────────────────────────────────────────────────────────────
@idempotent
@http(method: "DELETE", uri: "/v1/chirps/{chirpId}", code: 204)
operation DeleteChirp {
    input: DeleteChirpInput
    output: DeleteChirpOutput
    errors: [
        NotFoundError
        ForbiddenError
    ]
}

@input
structure DeleteChirpInput {
    @required
    @httpLabel
    chirpId: ChirpId
}

@output
structure DeleteChirpOutput {}

// ─── ListChirps ───────────────────────────────────────────────────────────────
@readonly
@http(method: "GET", uri: "/v1/chirps", code: 200)
operation ListChirps {
    input: ListChirpsInput
    output: ListChirpsOutput
}

@input
structure ListChirpsInput {
    @httpQuery("userId")
    userId: UserId

    @httpQuery("pageSize")
    pageSize: PageSize

    @httpQuery("nextToken")
    nextToken: NextToken
}

@output
structure ListChirpsOutput {
    @required
    chirps: ChirpList

    nextToken: NextToken
}
