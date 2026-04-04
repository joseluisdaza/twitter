$version: "2"

namespace com.chirp.api

use aws.protocols#restJson1
use com.chirp.auth#Login
use com.chirp.auth#Logout
use com.chirp.chirps#CreateChirp
use com.chirp.chirps#HideChirp
use com.chirp.chirps#LikeChirp
use com.chirp.chirps#UnlikeChirp

/// Servicio principal de la API de Chirp
@restJson1
@title("Chirp API")
service ChirpService {
    version: "2026-04-04"
    operations: [
        Login
        Logout
        CreateChirp
        LikeChirp
        UnlikeChirp
        HideChirp
    ]
}
