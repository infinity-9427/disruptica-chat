import pytest
from datetime import datetime
from uuid import UUID
from models.user import User


class TestUserModel:
    def test_user_creation(self, db_session):
        """Test user model creation"""
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hashed_password_here"
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert isinstance(user.id, UUID)
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.hashed_password == "hashed_password_here"
        assert user.is_active is True
        assert isinstance(user.created_at, datetime)
        assert user.last_login is None

    def test_user_repr(self, db_session):
        """Test user model string representation"""
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hashed_password_here"
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        repr_str = repr(user)
        assert "User" in repr_str
        assert "test@example.com" in repr_str
        assert "testuser" in repr_str

    def test_user_unique_email(self, db_session):
        """Test that email must be unique"""
        user1 = User(
            email="test@example.com",
            username="testuser1",
            hashed_password="hashed_password_here"
        )
        
        user2 = User(
            email="test@example.com",  # Same email
            username="testuser2",
            hashed_password="hashed_password_here"
        )
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        
        # This should raise an integrity error due to unique constraint
        with pytest.raises(Exception):
            db_session.commit()