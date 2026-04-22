$version: "2"

namespace com.chirp.api

use aws.protocols#restJson1

// Auth operations
use com.chirp.auth#Login

use com.chirp.auth#Logout
use com.chirp.auth#Register

// Chirp operations
use com.chirp.chirps#CreateChirp

use com.chirp.chirps#DeleteChirp
use com.chirp.chirps#GetChirp
use com.chirp.chirps#GetChirpLikes
use com.chirp.chirps#GetTimeline
use com.chirp.chirps#GetUserChirps
use com.chirp.chirps#GetUserLikes
use com.chirp.chirps#HideChirp
use com.chirp.chirps#LikeChirp
use com.chirp.chirps#UnlikeChirp

// Comment operations
use com.chirp.comments#CreateComment

use com.chirp.comments#DeleteComment
use com.chirp.comments#GetChirpComments

// Follow operations
use com.chirp.follows#FollowUser

use com.chirp.follows#GetFollowers
use com.chirp.follows#GetFollowing
use com.chirp.follows#UnfollowUser

// User operations
use com.chirp.users#GetUser

use com.chirp.users#GetUserByUsername
use com.chirp.users#UpdateUserProfile

/// Servicio principal de la API de Chirp
@restJson1
@title("Chirp API")
service ChirpService {
    version: "2026-04-04"
    operations: [
        // Auth
        Login
        Logout
        Register
        // Chirps
        CreateChirp
        GetChirp
        GetUserChirps
        GetTimeline
        DeleteChirp
        LikeChirp
        UnlikeChirp
        GetChirpLikes
        GetUserLikes
        HideChirp
        // Users
        GetUser
        GetUserByUsername
        UpdateUserProfile
        // Follows
        FollowUser
        UnfollowUser
        GetFollowers
        GetFollowing
        // Comments
        CreateComment
        GetChirpComments
        DeleteComment
    ]
}
