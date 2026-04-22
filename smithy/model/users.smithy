$version: "2"

namespace com.chirp.users

use com.chirp.common#AvatarUrl
use com.chirp.common#Bio
use com.chirp.common#DateTime
use com.chirp.common#DisplayName
use com.chirp.common#Email
use com.chirp.common#ForbiddenError
use com.chirp.common#InternalServerError
use com.chirp.common#NotFoundError
use com.chirp.common#UUID
use com.chirp.common#UnauthorizedError
use com.chirp.common#Username
use com.chirp.common#ValidationError

/// ============================================================================
/// OBTENER USUARIO POR ID
/// ============================================================================
/// Obtiene el perfil de un usuario por su ID (Partition Key de chirp-users)
@readonly
@http(method: "GET", uri: "/users/{userId}")
operation GetUser {
    input: GetUserInput
    output: GetUserOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetUserInput {
    @required
    @httpLabel
    userId: UUID
}

structure GetUserOutput {
    @required
    user: User
}

/// ============================================================================
/// OBTENER USUARIO POR USERNAME
/// ============================================================================
/// Busca un usuario por su username usando el GSI username-index de chirp-users
@readonly
@http(method: "GET", uri: "/users/by-username/{username}")
operation GetUserByUsername {
    input: GetUserByUsernameInput
    output: GetUserByUsernameOutput
    errors: [
        NotFoundError
        UnauthorizedError
        InternalServerError
    ]
}

structure GetUserByUsernameInput {
    @required
    @httpLabel
    username: Username
}

structure GetUserByUsernameOutput {
    @required
    user: User
}

/// ============================================================================
/// ACTUALIZAR PERFIL DE USUARIO
/// ============================================================================
/// Actualiza los campos editables del perfil (displayName, bio, avatarUrl)
@idempotent
@http(method: "PUT", uri: "/users/{userId}")
operation UpdateUserProfile {
    input: UpdateUserProfileInput
    output: UpdateUserProfileOutput
    errors: [
        ValidationError
        NotFoundError
        UnauthorizedError
        ForbiddenError
        InternalServerError
    ]
}

structure UpdateUserProfileInput {
    @required
    @httpLabel
    userId: UUID

    /// Nombre de visualización (opcional — solo se actualiza si se envía)
    displayName: DisplayName

    /// Biografía del perfil (opcional)
    bio: Bio

    /// URL de la foto de perfil (opcional)
    avatarUrl: AvatarUrl
}

structure UpdateUserProfileOutput {
    @required
    user: User
}

/// ============================================================================
/// ESTRUCTURA PRINCIPAL: USER
/// ============================================================================
/// Representa un usuario de la plataforma (corresponde a chirp-users en DynamoDB)
structure User {
    /// Identificador único del usuario (PK de chirp-users)
    @required
    userId: UUID

    /// Nombre de usuario único (@handle)
    @required
    username: Username

    /// Email del usuario
    @required
    email: Email

    /// Nombre de visualización en el perfil
    @required
    displayName: DisplayName

    /// Biografía del perfil
    bio: Bio

    /// URL de la foto de perfil
    avatarUrl: AvatarUrl

    /// Fecha de creación de la cuenta
    @required
    createdAt: DateTime

    /// Cuenta verificada (badge azul)
    @required
    verified: Boolean

    /// Número de seguidores
    @required
    followersCount: Integer

    /// Número de usuarios seguidos
    @required
    followingCount: Integer
}
