import pytest
from fastapi import status
from controllers.auth import auth_controller


class TestAuth:
    def test_register_user(self, client, test_user_data):
        """Test user registration"""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "hashed_password" not in data  # Should not expose password

    def test_register_duplicate_email(self, client, test_user_data):
        """Test registering with duplicate email"""
        # Register first user
        client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try to register with same email
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already registered" in response.json()["detail"]

    def test_register_invalid_data(self, client):
        """Test registration with invalid data"""
        invalid_data = {
            "email": "invalid-email",
            "username": "u",  # Too short
            "password": "123"  # Too short
        }
        response = client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_success(self, client, test_user_data, test_login_data):
        """Test successful login"""
        # Register user first
        client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login
        response = client.post("/api/v1/auth/login", json=test_login_data)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == 30 * 60  # 30 minutes

    def test_login_invalid_credentials(self, client, test_user_data):
        """Test login with invalid credentials"""
        # Register user first
        client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try login with wrong password
        invalid_login = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        response = client.post("/api/v1/auth/login", json=invalid_login)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user(self, client, test_user_data, test_login_data):
        """Test getting current user information"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        token = login_response.json()["access_token"]
        
        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_token(self, client, test_user_data, test_login_data):
        """Test token refresh"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        refresh_data = {"refresh_token": refresh_token}
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_invalid_token(self, client):
        """Test refresh with invalid token"""
        refresh_data = {"refresh_token": "invalid_token"}
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout(self, client, test_user_data, test_login_data):
        """Test user logout"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        refresh_token = login_response.json()["refresh_token"]
        
        # Logout
        logout_data = {"refresh_token": refresh_token}
        response = client.post("/api/v1/auth/logout", json=logout_data)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Successfully logged out"
        
        # Try to use refresh token after logout - should fail
        refresh_response = client.post("/api/v1/auth/refresh", json=logout_data)
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED