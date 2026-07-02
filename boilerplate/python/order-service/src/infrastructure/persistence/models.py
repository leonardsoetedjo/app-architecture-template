from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Numeric, Integer, Uuid
from sqlalchemy.orm import relationship, declarative_base
from uuid import uuid4
from datetime import datetime


Base = declarative_base()


Base = declarative_base()


class OrderEntity(Base):
    """SQLAlchemy entity for Order table."""
    __tablename__ = "orders"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=lambda: str(uuid4()))
    customer_id = Column(Uuid(as_uuid=True), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(String(20), nullable=False, default="PENDING")
    confirmed_at = Column(DateTime, nullable=True)
    version = Column(Integer, nullable=False, default=0, server_default='0')

    # One-to-many relationship
    items = relationship(
        "OrderItemEntity",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItemEntity(Base):
    """SQLAlchemy entity for OrderItem table."""
    __tablename__ = "order_items"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=lambda: str(uuid4()))
    order_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(19, 4), nullable=False)

    order = relationship("OrderEntity", back_populates="items")


class OutboxEventEntity(Base):
    """SQLAlchemy entity for Outbox pattern."""
    __tablename__ = "outbox_events"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    event_type = Column(String(100), nullable=False)
    aggregate_id = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    error_message = Column(Text, nullable=True)


class MfaConfigEntity(Base):
    """SQLAlchemy entity for MFA configuration table."""
    __tablename__ = "mfa_configs"

    user_id = Column(Uuid(as_uuid=True), primary_key=True)
    enabled = Column(Integer, nullable=False, default=0)  # SQLite boolean as int
    totp_secret = Column(String(255), nullable=True)
    totp_verified = Column(Integer, nullable=True, default=0)  # 0=False, 1=True
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    backup_codes = relationship(
        "BackupCodeEntity",
        back_populates="mfa_config",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    webauthn_credentials = relationship(
        "WebAuthnCredentialEntity",
        back_populates="mfa_config",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class BackupCodeEntity(Base):
    """SQLAlchemy entity for backup codes."""
    __tablename__ = "backup_codes"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("mfa_configs.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    code_hash = Column(String(255), nullable=False)  # Store hashed codes
    used = Column(Integer, nullable=False, default=0)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    mfa_config = relationship("MfaConfigEntity", back_populates="backup_codes")


class WebAuthnCredentialEntity(Base):
    """SQLAlchemy entity for WebAuthn credentials."""
    __tablename__ = "webauthn_credentials"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("mfa_configs.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    credential_id = Column(String(255), nullable=False, unique=True)
    public_key = Column(Text, nullable=False)
    sign_count = Column(Integer, nullable=False, default=0)
    enabled = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    mfa_config = relationship("MfaConfigEntity", back_populates="webauthn_credentials")
