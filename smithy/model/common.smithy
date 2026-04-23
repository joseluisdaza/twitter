$version: "2"

namespace com.chirp.common

/// Estructura base para errores de validación
@error("client")
structure ValidationError {
    @required
    message: String

    /// Campo que falló la validación
    field: String
}

/// Error cuando el recurso no se encuentra
@error("client")
@httpError(404)
structure NotFoundError {
    @required
    message: String

    @required
    resourceType: String

    @required
    resourceId: String
}

/// Error de autenticación (no autenticado)
@error("client")
@httpError(401)
structure UnauthorizedError {
    @required
    message: String
}

/// Error de autorización (autenticado pero sin permisos)
@error("client")
@httpError(403)
structure ForbiddenError {
    @required
    message: String
}

/// Error interno del servidor
@error("server")
@httpError(500)
structure InternalServerError {
    @required
    message: String
}

/// Timestamp en formato ISO 8601
@timestampFormat("date-time")
timestamp DateTime

/// UUID (formato: 550e8400-e29b-41d4-a716-446655440000)
@pattern("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
string UUID

/// Email válido
@pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
string Email

/// Contenido de un chirp (1-280 caracteres)
@length(min: 1, max: 280)
string ChirpContent

/// Username (3-30 caracteres alfanuméricos, guiones y underscore)
@pattern("^[a-zA-Z0-9_-]{3,30}$")
string Username

/// Nombre de visualización del perfil (1-100 caracteres)
@length(min: 1, max: 100)
string DisplayName

/// Biografía del perfil (0-160 caracteres)
@length(min: 0, max: 160)
string Bio

/// URL de avatar/imagen de perfil
@pattern("^https?://.+$")
string AvatarUrl

/// Token opaco de paginación (cursor)
string PaginationToken

/// Número de elementos por página (1-100)
@range(min: 1, max: 100)
integer PageSize

/// Contenido de un comentario (1-280 caracteres)
@length(min: 1, max: 280)
string CommentContent

/// Error de conflicto (recurso ya existe)
@error("client")
@httpError(409)
structure ConflictError {
    @required
    message: String

    @required
    resourceType: String
}
