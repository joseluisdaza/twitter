$version: "2"

namespace com.chirp

use aws.protocols#restJson1

/// Servicio principal de la API de Chirp
@title("Chirp API")
@restJson1
@httpBearerAuth
@paginated(inputToken: "nextToken", outputToken: "nextToken", pageSize: "pageSize")
service ChirpService {
    version: "2026-04-04"
    resources: [
        UserResource
        ChirpResource
    ]
    operations: [
        Login
        Logout
        ListFollowers
        ListFollowing
    ]
    errors: [
        UnauthorizedError
        ForbiddenError
        InternalServerError
    ]
}
