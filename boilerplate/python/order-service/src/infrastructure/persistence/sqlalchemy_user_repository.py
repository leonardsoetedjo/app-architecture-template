from __future__ import annotations
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, Session
from ..domain.models.user import User, UserId, Email, Password, Role, USER_ROLE
from ..domain.ports.auth_ports import UserRepository

Base = declarative_base()

class UserEntity(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    roles = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def save(self, user: User) -> User:
        with self.session_factory() as session:
            entity = self._from_domain(user)
            session.merge(entity)
            session.commit()
            return user

    def find_by_id(self, user_id: UserId) -> Optional[User]:
        with self.session_factory() as session:
            entity = session.query(UserEntity).filter(UserEntity.id == user_id.value).first()
            return self._to_domain(entity) if entity else None

    def find_by_email(self, email: Email) -> Optional[User]:
        with self.session_factory() as session:
            entity = session.query(UserEntity).filter(UserEntity.email == email.value).first()
            return self._to_domain(entity) if entity else None

    def exists_by_email(self, email: Email) -> bool:
        with self.session_factory() as session:
            return session.query(UserEntity).filter(UserEntity.email == email.value).first() is not None

    def delete_by_id(self, user_id: UserId) -> None:
        with self.session_factory() as session:
            session.query(UserEntity).filter(UserEntity.id == user_id.value).delete()
            session.commit()

    def count(self) -> int:
        with self.session_factory() as session:
            return session.query(UserEntity).count()

    def _from_domain(self, user: User) -> UserEntity:
        return UserEntity(
            id=user.id.value,
            email=user.email.value,
            password_hash=user.password.hashed_value,
            roles=",".join([r.code for r in user.roles]),
            enabled=user.enabled,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        )

    def _to_domain(self, entity: UserEntity) -> User:
        roles = {Role(name=r.split(':')[0], code=r) for r in entity.roles.split(",")} if entity.roles else {USER_ROLE}
        # In a real app we'd map Role codes back to full Role objects via a lookup
        return User(
            id=UserId(entity.id),
            email=Email(entity.email),
            password=Password(entity.password_hash),
            roles=roles,
            enabled=entity.enabled,
            created_at=entity.created_at,
            last_login_at=entity.last_login_at
        )
