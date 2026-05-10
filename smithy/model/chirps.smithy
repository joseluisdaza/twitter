$version: "2"

namespace com.chirp.chirps

use com.chirp.common#ChirpContent
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
/// CREAR CHIRP
/// ============================================================================
/// Operación para crear un chirp
@http(method: "POST", uri: "/chirps")
operation CreateChirp {
    input: CreateChirpInput
    output: CreateChirpOutput
    errors: [
        ValidationError
        UnauthorizedError
        InternalServerError
    ]
}

structure CreateChirpInput {
    @required
    content: ChirpContent

    /// URLs de imágenes/videos (opcional)
    mediaUrls: MediaUrlList
}

structure CreateChirpOutput {
    @required
    chirp: Chirp
}

/// ============================================================================
/// DAR LIKE
/// ============================================================================
@http(method: "POST", uri: "/chirps/{chirpId}/like")
operation LikeChirp {
    input: LikeChirpInput
    output: LikeChirpOutput
    errors: [
        ValidationError
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure LikeChirpInput {
    @required
    @httpLabel
    chirpId: UUID
}

structure LikeChirpOutput {
    @required
    message: String = "Like added successfully"

    @required
    chirp: Chirp
}

/// ============================================================================
/// QUITAR LIKE
/// ============================================================================
@http(method: "DELETE", uri: "/chirps/{chirpId}/like")
@idempotent
operation UnlikeChirp {
    input: UnlikeChirpInput
    output: UnlikeChirpOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure UnlikeChirpInput {
    @required
    @httpLabel
    chirpId: UUID
}

structure UnlikeChirpOutput {
    @required
    message: String = "Like removed successfully"

    @required
    chirp: Chirp
}

/// ============================================================================
/// OCULTAR CHIRP
/// ============================================================================
@http(method: "POST", uri: "/chirps/{chirpId}/hide")
operation HideChirp {
    input: HideChirpInput
    output: HideChirpOutput
    errors: [
        NotFoundError
        UnauthorizedError
        ForbiddenError
        InternalServerError
    ]
}

structure HideChirpInput {
    @required
    @httpLabel
    chirpId: UUID
}

structure HideChirpOutput {
    @required
    message: String = "Chirp hidden successfully"

    @required
    chirp: Chirp
}

/// ============================================================================
/// ESTRUCTURAS DE DATOS
/// ============================================================================
/// Estructura principal de un Chirp
structure Chirp {
    @required
    chirpId: UUID

    @required
    userId: UUID

    @required
    username: Username

    @required
    content: ChirpContent

    mediaUrls: MediaUrlList

    @required
    createdAt: DateTime

    @required
    likesCount: Integer

    @required
    commentsCount: Integer

    @required
    repostsCount: Integer

    @required
    hidden: Boolean = false
}

list MediaUrlList {
    member: String
}

/// ============================================================================
/// OBTENER CHIRP POR ID
/// ============================================================================
/// Obtiene un chirp específico por su chirpId (PK de chirp-chirps)
@readonly
@http(method: "GET", uri: "/chirps/{chirpId}")
operation GetChirp {
    input: GetChirpInput
    output: GetChirpOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetChirpInput {
    @required
    @httpLabel
    chirpId: UUID
}

structure GetChirpOutput {
    @required
    chirp: Chirp
}

/// ============================================================================
/// OBTENER CHIRPS DE UN USUARIO
/// ============================================================================
/// Lista los chirps de un usuario usando el GSI userId-createdAt-index de chirp-chirps
@readonly
@http(method: "GET", uri: "/users/{userId}/chirps")
operation GetUserChirps {
    input: GetUserChirpsInput
    output: GetUserChirpsOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetUserChirpsInput {
    @required
    @httpLabel
    userId: UUID

    /// Número máximo de resultados a retornar
    @httpQuery("limit")
    limit: PageSize

    /// Token de paginación (LastEvaluatedKey de DynamoDB codificado en base64)
    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetUserChirpsOutput {
    @required
    chirps: ChirpList

    /// Token para obtener la siguiente página (null si no hay más resultados)
    nextToken: PaginationToken
}

/// ============================================================================
/// OBTENER TIMELINE
/// ============================================================================
/// Retorna los chirps de los usuarios que sigue el usuario autenticado
/// Usa el GSI userId-createdAt-index y la tabla chirp-follows (fan-out on read)
@readonly
@http(method: "GET", uri: "/timeline")
operation GetTimeline {
    input: GetTimelineInput
    output: GetTimelineOutput
    errors: [
        UnauthorizedError
        InternalServerError
    ]
}

structure GetTimelineInput {
    /// Número máximo de resultados a retornar
    @httpQuery("limit")
    limit: PageSize

    /// Token de paginación
    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetTimelineOutput {
    @required
    chirps: ChirpList

    nextToken: PaginationToken
}

/// ============================================================================
/// ELIMINAR CHIRP
/// ============================================================================
/// Elimina un chirp (solo el autor puede eliminar el suyo)
@idempotent
@http(method: "DELETE", uri: "/chirps/{chirpId}")
operation DeleteChirp {
    input: DeleteChirpInput
    output: DeleteChirpOutput
    errors: [
        NotFoundError
        UnauthorizedError
        ForbiddenError
        InternalServerError
    ]
}

structure DeleteChirpInput {
    @required
    @httpLabel
    chirpId: UUID
}

structure DeleteChirpOutput {
    @required
    message: String = "Chirp deleted successfully"
}

/// ============================================================================
/// OBTENER LIKES DE UN CHIRP
/// ============================================================================
/// Lista los usuarios que dieron like a un chirp (PK de chirp-likes)
@readonly
@http(method: "GET", uri: "/chirps/{chirpId}/likes")
operation GetChirpLikes {
    input: GetChirpLikesInput
    output: GetChirpLikesOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetChirpLikesInput {
    @required
    @httpLabel
    chirpId: UUID

    @httpQuery("limit")
    limit: PageSize

    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetChirpLikesOutput {
    @required
    likes: LikeRecordList

    nextToken: PaginationToken
}

/// ============================================================================
/// OBTENER CHIRPS QUE LE GUSTARON A UN USUARIO
/// ============================================================================
/// Lista los chirps que le gustaron a un usuario usando el GSI userId-chirpId-index
@readonly
@http(method: "GET", uri: "/users/{userId}/likes")
operation GetUserLikes {
    input: GetUserLikesInput
    output: GetUserLikesOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetUserLikesInput {
    @required
    @httpLabel
    userId: UUID

    @httpQuery("limit")
    limit: PageSize

    @httpQuery("nextToken")
    nextToken: PaginationToken
}

structure GetUserLikesOutput {
    @required
    likes: LikeRecordList

    nextToken: PaginationToken
}

/// ============================================================================
/// ESTRUCTURA: LikeRecord
/// ============================================================================
/// Registro de un like en chirp-likes (chirpId + userId como clave compuesta)
structure LikeRecord {
    @required
    chirpId: UUID

    @required
    userId: UUID

    @required
    username: Username

    @required
    createdAt: DateTime
}

list ChirpList {
    member: Chirp
}

list LikeRecordList {
    member: LikeRecord
}
