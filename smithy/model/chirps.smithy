$version: "2"

namespace com.chirp.chirps

use com.chirp.common#ChirpContent
use com.chirp.common#DateTime
use com.chirp.common#ForbiddenError
use com.chirp.common#InternalServerError
use com.chirp.common#NotFoundError
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
