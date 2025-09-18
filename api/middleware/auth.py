from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from starlette.middleware.base import BaseHTTPMiddleware

from utils.jwt import verify_token
from controllers.auth import auth_controller


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, protected_paths: list = None):
        super().__init__(app)
        self.protected_paths = protected_paths or ["/api/v1/chat", "/api/v1/stream"]
    
    async def dispatch(self, request: Request, call_next):
        # Check if the path requires authentication
        if not any(request.url.path.startswith(path) for path in self.protected_paths):
            response = await call_next(request)
            return response
        
        # Get the authorization header
        authorization = request.headers.get("authorization")
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        scheme, token = get_authorization_scheme_param(authorization)
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            # Verify the token
            token_data = verify_token(token)
            
            # Get user from controller
            user = auth_controller.get_user_by_id(token_data.user_id)
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )
            
            # Add user to request state
            request.state.current_user = user
            
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        response = await call_next(request)
        return response