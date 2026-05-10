$version: "2"

namespace com.chirp.comments

use com.chirp.common#CommentContent
use com.chirp.common#DateTime
use com.chirp.common#ForbiddenError
use com.chirp.common#InternalServerError
use com.chirp.common#NotFoundError
use com.chirp.common#PageSize
use com.chirp.common#PaginationToken
use com.chirp.common#UUID
use com.chirp.common#UnauthorizedError
use com.chirp.common#Username
use com.chirp.common#ValidationError

/// ============================================================================
/// CREAR COMENTARIO
/// ============================================================================
/// Agrega un comentario a un chirp en chirp-comments
/// También incrementa commentsCount en el chirp correspondiente (chirp-chirps)
@http(method: "POST", uri: "/chirps/{chirpId}/comments")
operation CreateComment {
    input: CreateCommentInput
    output: CreateCommentOutput
    errors: [
        ValidationError
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure CreateCommentInput {
    /// ID del chirp al que se comenta (FK → chirp-chirps)
    @required
    @httpLabel
    chirpId: UUID

    @required
    content: CommentContent
}

structure CreateCommentOutput {
    @required
    comment: Comment
}

/// ============================================================================
/// OBTENER COMENTARIOS DE UN CHIRP
/// ============================================================================
/// Lista los comentarios de un chirp usando el GSI chirpId-createdAt-index
/// Los resultados se ordenan por fecha (más antiguos primero por defecto)
@readonly
@http(method: "GET", uri: "/chirps/{chirpId}/comments")
operation GetChirpComments {
    input: GetChirpCommentsInput
    output: GetChirpCommentsOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetChirpCommentsInput {
    @required
    @httpLabel
    chirpId: UUID

    @httpQuery("limit")
    limit: PageSize

    /// Token de paginación (LastEvaluatedKey de DynamoDB codificado en base64)
    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetChirpCommentsOutput {
    @required
    comments: CommentList

    nextToken: PaginationToken
}

/// ============================================================================
/// ELIMINAR COMENTARIO
/// ============================================================================
/// Elimina un comentario (solo el autor puede eliminarlo)
/// También decrementa commentsCount en el chirp correspondiente
@idempotent
@http(method: "DELETE", uri: "/chirps/{chirpId}/comments/{commentId}")
operation DeleteComment {
    input: DeleteCommentInput
    output: DeleteCommentOutput
    errors: [
        NotFoundError
        UnauthorizedError
        ForbiddenError
        InternalServerError
    ]
}

structure DeleteCommentInput {
    @required
    @httpLabel
    chirpId: UUID

    @required
    @httpLabel
    commentId: UUID
}

structure DeleteCommentOutput {
    @required
    message: String = "Comment deleted successfully"
}

/// ============================================================================
/// ESTRUCTURA: Comment
/// ============================================================================
/// Representa un comentario en chirp-comments
/// PK: commentId | GSI: chirpId-createdAt-index, userId-createdAt-index
structure Comment {
    /// Identificador único del comentario (PK de chirp-comments)
    @required
    commentId: UUID

    /// Chirp al que pertenece el comentario (FK → chirp-chirps)
    @required
    chirpId: UUID

    /// Usuario que comentó (FK → chirp-users)
    @required
    userId: UUID

    /// Username desnormalizado para performance
    @required
    username: Username

    /// Contenido del comentario (1-280 caracteres)
    @required
    content: CommentContent

    /// Fecha de creación (Sort Key del GSI chirpId-createdAt-index)
    @required
    createdAt: DateTime

    /// Contador de likes del comentario
    @required
    likesCount: Integer
}

list CommentList {
    member: Comment
}
