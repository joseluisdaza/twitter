$version: "2"

namespace com.chirp.auth

use com.chirp.common#Email
use com.chirp.common#InternalServerError
use com.chirp.common#UnauthorizedError
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
