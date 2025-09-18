import pytest
from fastapi import status


class TestChat:
    def test_chat_protected_endpoint(self, client, test_user_data, test_login_data):
        """Test that chat endpoint requires authentication"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        token = login_response.json()["access_token"]
        
        # Test chat endpoint with valid token
        headers = {"Authorization": f"Bearer {token}"}
        chat_data = {
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        }
        response = client.post("/api/v1/chat/", json=chat_data, headers=headers)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "message" in data
        assert "user_id" in data
        assert "messages_received" in data

    def test_chat_unauthorized(self, client):
        """Test chat endpoint without authentication"""
        chat_data = {
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        }
        response = client.post("/api/v1/chat/", json=chat_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_chat_invalid_token(self, client):
        """Test chat endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        chat_data = {
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        }
        response = client.post("/api/v1/chat/", json=chat_data, headers=headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_chat_empty_messages(self, client, test_user_data, test_login_data):
        """Test chat endpoint with empty messages"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        chat_data = {"messages": []}
        response = client.post("/api/v1/chat/", json=chat_data, headers=headers)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_stream_protected_endpoint(self, client, test_user_data, test_login_data):
        """Test that stream endpoint requires authentication"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        token = login_response.json()["access_token"]
        
        # Test stream endpoint with valid token
        headers = {"Authorization": f"Bearer {token}"}
        stream_data = {"prompt": "Hello, how are you?"}
        response = client.post("/api/v1/chat/stream", json=stream_data, headers=headers)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "message" in data
        assert "user_id" in data
        assert "prompt" in data

    def test_stream_unauthorized(self, client):
        """Test stream endpoint without authentication"""
        stream_data = {"prompt": "Hello, how are you?"}
        response = client.post("/api/v1/chat/stream", json=stream_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_stream_empty_prompt(self, client, test_user_data, test_login_data):
        """Test stream endpoint with empty prompt"""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post("/api/v1/auth/login", json=test_login_data)
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        stream_data = {"prompt": ""}
        response = client.post("/api/v1/chat/stream", json=stream_data, headers=headers)
        assert response.status_code == status.HTTP_400_BAD_REQUEST