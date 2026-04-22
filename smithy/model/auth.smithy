$version: "2"

namespace com.chirp.auth

use com.chirp.common#Bio
use com.chirp.common#ConflictError
use com.chirp.common#DisplayName
use com.chirp.common#Email
use com.chirp.common#InternalServerError
use com.chirp.common#UUID
use com.chirp.common#UnauthorizedError
use com.chirp.common#Username
use com.chirp.common#ValidationError

/// ============================================================================
/// LOGIN
/// ============================================================================
/// Operación de login
@http(method: "POST", uri: "/auth/login")
operation Login {
    input: LoginInput
    output: LoginOutput
    errors: [
        ValidationError
        UnauthorizedError
        InternalServerError
    ]
}

/// Input para login
structure LoginInput {
    @required
    email: Email

    @required
    @length(min: 8, max: 128)
    password: String
}

/// Output de login exitoso
structure LoginOutput {
    @required
    accessToken: String

    @required
    idToken: String

    @required
    refreshToken: String

    @required
    expiresIn: Integer

    @required
    tokenType: String = "Bearer"
}

/// ============================================================================
/// LOGOUT
/// ============================================================================
/// Operación de logout
@http(method: "POST", uri: "/auth/logout")
operation Logout {
    input: LogoutInput
    output: LogoutOutput
    errors: [
        UnauthorizedError
        InternalServerError
    ]
}

/// Input para logout
structure LogoutInput {}

/// Output de logout
structure LogoutOutput {
    @required
    message: String = "Logged out successfully"
}

/// ============================================================================
/// REGISTER
/// ============================================================================
/// Registrar un nuevo usuario (crea cuenta en Cognito + perfil en DynamoDB)
@http(method: "POST", uri: "/auth/register")
operation Register {
    input: RegisterInput
    output: RegisterOutput
    errors: [
        ValidationError
        ConflictError
        InternalServerError
    ]
}

/// Input para registro de nuevo usuario
structure RegisterInput {
    @required
    email: Email

    @required
    @length(min: 8, max: 128)
    password: String

    @required
    username: Username

    @required
    displayName: DisplayName

    /// Biografía opcional del perfil
    bio: Bio
}

/// Output de registro exitoso
structure RegisterOutput {
    @required
    userId: UUID

    @required
    username: Username

    @required
    email: Email

    @required
    message: String = "User registered successfully. Please verify your email."
}
