$version: "2"

namespace com.chirp

// ─── Login ────────────────────────────────────────────────────────────────────
/// Autenticación de usuario con email y contraseña
@http(method: "POST", uri: "/v1/auth/login", code: 200)
operation Login {
    input: LoginInput
    output: LoginOutput
    errors: [
        BadRequestError
        UnauthorizedError
    ]
}

@input
structure LoginInput {
    @required
    email: Email

    @required
    @length(min: 8, max: 128)
    password: String
}

@output
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
    tokenType: String
}

// ─── Logout ───────────────────────────────────────────────────────────────────
/// Cierre de sesión del usuario autenticado
@http(method: "POST", uri: "/v1/auth/logout", code: 200)
operation Logout {
    input: LogoutInput
    output: LogoutOutput
    errors: [
        UnauthorizedError
    ]
}

@input
structure LogoutInput {}

@output
structure LogoutOutput {
    @required
    message: String
}
