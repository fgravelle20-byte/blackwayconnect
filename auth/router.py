"""
Routes d'authentification - Login, Register, Refresh, Reset.
"""

from fastapi import APIRouter, HTTPException, status, Depends

from auth.models import (
    UserCreate, UserResponse, TokenPair,
    LoginRequest, PasswordResetRequest, PasswordResetConfirm
)
from auth.utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_current_user
)

router = APIRouter()


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Inscription d'un nouvel utilisateur."""
    # TODO: Vérifier si l'email existe déjà en DB
    hashed = hash_password(user_data.password)
    # TODO: Sauvegarder en DB
    token_data = {"sub": user_data.email, "role": user_data.role.value}
    return TokenPair(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=1800,
    )


@router.post("/login", response_model=TokenPair)
async def login(credentials: LoginRequest):
    """Connexion utilisateur avec email/password."""
    # TODO: Récupérer l'utilisateur de la DB et vérifier le password
    token_data = {"sub": credentials.email, "role": "client"}
    return TokenPair(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=1800,
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(refresh_token: str):
    """Renouvelle les tokens avec un refresh token valide."""
    from auth.utils import decode_token
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Token type invalide")
    token_data = {"sub": payload["sub"], "role": payload.get("role", "client")}
    return TokenPair(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=1800,
    )


@router.post("/password-reset")
async def request_password_reset(data: PasswordResetRequest):
    """Envoie un email de réinitialisation du mot de passe."""
    # TODO: Générer un token de reset, envoyer par email
    return {"message": "Si ce compte existe, un email de réinitialisation a été envoyé."}


@router.post("/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    """Confirme la réinitialisation avec le token reçu par email."""
    # TODO: Valider le token et mettre à jour le password
    return {"message": "Mot de passe mis à jour avec succès."}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retourne le profil de l'utilisateur connecté."""
    return {"user": current_user}
