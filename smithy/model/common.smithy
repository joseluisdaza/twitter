$version: "2"

namespace com.chirp

// ─── IDs ─────────────────────────────────────────────────────────────────────
/// UUID v4 de usuario
@pattern("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
string UserId

/// UUID v4 de chirp
@pattern("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
string ChirpId

/// UUID v4 de comentario
@pattern("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
string CommentId

// ─── Tipos comunes ────────────────────────────────────────────────────────────
/// Timestamp ISO 8601 (ej: 2026-04-05T12:00:00Z)
@pattern("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")
string Timestamp

/// URL de media (imagen o video)
@length(min: 1, max: 2048)
string MediaUrl

list MediaUrlList {
    member: MediaUrl
}

/// Token de paginación
string NextToken

/// Tamaño de página (1–100)
@range(min: 1, max: 100)
integer PageSize

/// Email válido
@pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
string Email

// ─── Errores ─────────────────────────────────────────────────────────────────
@error("client")
@httpError(400)
structure BadRequestError {
    @required
    message: String
}

@error("client")
@httpError(401)
structure UnauthorizedError {
    @required
    message: String
}

@error("client")
@httpError(403)
structure ForbiddenError {
    @required
    message: String
}

@error("client")
@httpError(404)
structure NotFoundError {
    @required
    message: String
}

@error("client")
@httpError(409)
structure ConflictError {
    @required
    message: String
}

@error("server")
@httpError(500)
structure InternalServerError {
    @required
    message: String
}
