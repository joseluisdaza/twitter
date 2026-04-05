$version: "2"

namespace com.chirp

resource CommentResource {
    identifiers: { chirpId: ChirpId, commentId: CommentId }
    create: CreateComment
    delete: DeleteComment
    list: ListComments
}

// ─── Tipos de Comentario ──────────────────────────────────────────────────────
/// Contenido de un comentario (1–500 caracteres)
@length(min: 1, max: 500)
string CommentContent

structure Comment {
    @required
    commentId: CommentId

    @required
    chirpId: ChirpId

    @required
    userId: UserId

    @required
    content: CommentContent

    @required
    createdAt: Timestamp
}

list CommentList {
    member: Comment
}

// ─── CreateComment ────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/v1/chirps/{chirpId}/comments", code: 201)
operation CreateComment {
    input: CreateCommentInput
    output: CreateCommentOutput
    errors: [
        BadRequestError
        NotFoundError
    ]
}

@input
structure CreateCommentInput {
    @required
    @httpLabel
    chirpId: ChirpId

    @required
    content: CommentContent
}

@output
structure CreateCommentOutput {
    @required
    @httpPayload
    comment: Comment
}

// ─── DeleteComment ────────────────────────────────────────────────────────────
@idempotent
@http(method: "DELETE", uri: "/v1/chirps/{chirpId}/comments/{commentId}", code: 204)
operation DeleteComment {
    input: DeleteCommentInput
    output: DeleteCommentOutput
    errors: [
        NotFoundError
        ForbiddenError
    ]
}

@input
structure DeleteCommentInput {
    @required
    @httpLabel
    chirpId: ChirpId

    @required
    @httpLabel
    commentId: CommentId
}

@output
structure DeleteCommentOutput {}

// ─── ListComments ─────────────────────────────────────────────────────────────
@readonly
@http(method: "GET", uri: "/v1/chirps/{chirpId}/comments", code: 200)
operation ListComments {
    input: ListCommentsInput
    output: ListCommentsOutput
    errors: [
        NotFoundError
    ]
}

@input
structure ListCommentsInput {
    @required
    @httpLabel
    chirpId: ChirpId

    @httpQuery("pageSize")
    pageSize: PageSize

    @httpQuery("nextToken")
    nextToken: NextToken
}

@output
structure ListCommentsOutput {
    @required
    comments: CommentList

    nextToken: NextToken
}
