# MFA/2FA Support Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement multi-factor authentication (MFA) support with TOTP, WebAuthn, and backup codes for both Java and Python backends.

**Architecture:** 
- Domain layer: MFA methods as value objects, User aggregate with MFA state
- Application layer: Use cases for enabling/disabling MFA, generating secrets, verifying codes
- Infrastructure: TOTP (pyotp/java-totp), WebAuthn (webauthn4j/webauthn), backup codes (secure generation)
- Tests: TDD approach with Testcontainers for integration tests

**Tech Stack:** 
- Python: pyotp, webauthn, cryptography
- Java: google.auth:webauthn4j-core, dev.topham:totp
- Database: PostgreSQL (store MFA secrets, backup codes, WebAuthn credentials)

---

## Phase 1: Domain Layer (Both Backends)

### Task 1.1: Create MfaMethod enum/value object

**Objective:** Define MFA method types (TOTP, WEBAUTHN, BACKUP_CODE)

**Files:**
- Create: `boilerplate/python/order-service/src/domain/models/mfa_method.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/models/MfaMethod.java`

**Python Step 1: Write failing test**

```python
# tests/domain/models/test_mfa_method.py
from domain.models.mfa_method import MfaMethod

def test_mfa_method_has_three_types():
    assert MfaMethod.TOTP.value == "TOTP"
    assert MfaMethod.WEBAUTHN.value == "WEBAUTHN"
    assert MfaMethod.BACKUP_CODE.value == "BACKUP_CODE"
```

**Python Step 2: Run test to verify failure**

```bash
cd boilerplate/python/order-service
pytest tests/domain/models/test_mfa_method.py::test_mfa_method_has_three_types -v
```
Expected: FAIL — "ModuleNotFoundError: No module named 'domain.models.mfa_method'"

**Python Step 3: Write minimal implementation**

```python
# src/domain/models/mfa_method.py
from enum import Enum


class MfaMethod(str, Enum):
    """Multi-factor authentication methods."""
    
    TOTP = "TOTP"
    WEBAUTHN = "WEBAUTHN"
    BACKUP_CODE = "BACKUP_CODE"
```

**Python Step 4: Run test to verify pass**

```bash
pytest tests/domain/models/test_mfa_method.py::test_mfa_method_has_three_types -v
```
Expected: PASS

**Python Step 5: Commit**

```bash
git add src/domain/models/mfa_method.py tests/domain/models/test_mfa_method.py
git commit -m "feat(domain): add MfaMethod enum for MFA types"
```

**Java Step 1: Write failing test**

```java
// src/test/java/com/example/orderservice/domain/models/MfaMethodTest.java
package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MfaMethodTest {
    @Test
    void testMfaMethodHasThreeTypes() {
        assertEquals("TOTP", MfaMethod.TOTP.getValue());
        assertEquals("WEBAUTHN", MfaMethod.WEBAUTHN.getValue());
        assertEquals("BACKUP_CODE", MfaMethod.BACKUP_CODE.getValue());
    }
}
```

**Java Step 2: Run test to verify failure**

```bash
cd boilerplate/java/order-service
mvn test -Dtest=MfaMethodTest
```
Expected: FAIL — "cannot find symbol: class MfaMethod"

**Java Step 3: Write minimal implementation**

```java
// src/main/java/com/example/orderservice/domain/models/MfaMethod.java
package com.example.orderservice.domain.models;

public enum MfaMethod {
    TOTP("TOTP"),
    WEBAUTHN("WEBAUTHN"),
    BACKUP_CODE("BACKUP_CODE");

    private final String value;

    MfaMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
```

**Java Step 4: Run test to verify pass**

```bash
mvn test -Dtest=MfaMethodTest
```
Expected: PASS

**Java Step 5: Commit**

```bash
git add src/main/java/com/example/orderservice/domain/models/MfaMethod.java src/test/java/com/example/orderservice/domain/models/MfaMethodTest.java
git commit -m "feat(domain): add MfaMethod enum for MFA types"
```

---

### Task 1.2: Create TotpSecret value object

**Objective:** Immutable value object for TOTP secret with validation

**Files:**
- Create: `boilerplate/python/order-service/src/domain/models/totp_secret.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/models/TotpSecret.java`

**Python Step 1: Write failing test**

```python
# tests/domain/models/test_totp_secret.py
import pytest
from domain.models.totp_secret import TotpSecret

def test_totp_secret_creation():
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    assert secret.secret == "JBSWY3DPEHPK3PXP"
    assert secret.verified is False

def test_totp_secret_requires_base32():
    with pytest.raises(ValueError, match="must be valid Base32"):
        TotpSecret("invalid-secret!")

def test_totp_secret_mark_verified():
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    verified = secret.mark_verified()
    assert verified.verified is True
    assert secret.verified is False  # immutable
```

**Python Step 2: Run test to verify failure**

```bash
cd boilerplate/python/order-service
pytest tests/domain/models/test_totp_secret.py -v
```
Expected: FAIL — ModuleNotFoundError

**Python Step 3: Write minimal implementation**

```python
# src/domain/models/totp_secret.py
from dataclasses import dataclass
import re


@dataclass(frozen=True)
class TotpSecret:
    """TOTP secret value object.
    
    Immutable (frozen) with validation for Base32 encoding.
    """
    
    secret: str
    verified: bool = False
    
    def __post_init__(self):
        if not self._is_valid_base32(self.secret):
            raise ValueError("Secret must be valid Base32 encoded string")
    
    @staticmethod
    def _is_valid_base32(value: str) -> bool:
        return bool(re.match(r'^[A-Z2-7]+=*$', value))
    
    def mark_verified(self) -> "TotpSecret":
        return TotpSecret(self.secret, verified=True)
```

**Python Step 4: Run test to verify pass**

```bash
pytest tests/domain/models/test_totp_secret.py -v
```
Expected: PASS

**Python Step 5: Commit**

```bash
git add src/domain/models/totp_secret.py tests/domain/models/test_totp_secret.py
git commit -m "feat(domain): add TotpSecret value object"
```

**Java Step 1: Write failing test**

```java
// src/test/java/com/example/orderservice/domain/models/TotpSecretTest.java
package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class TotpSecretTest {
    @Test
    void testTotpSecretCreation() {
        TotpSecret secret = new TotpSecret("JBSWY3DPEHPK3PXP");
        assertEquals("JBSWY3DPEHPK3PXP", secret.getSecret());
        assertFalse(secret.isVerified());
    }
    
    @Test
    void testInvalidBase32ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> {
            new TotpSecret("invalid-secret!");
        });
    }
    
    @Test
    void testMarkVerifiedReturnsNewInstance() {
        TotpSecret secret = new TotpSecret("JBSWY3DPEHPK3PXP");
        TotpSecret verified = secret.markVerified();
        assertTrue(verified.isVerified());
        assertFalse(secret.isVerified()); // immutable
    }
}
```

**Java Step 2: Run test to verify failure**

```bash
cd boilerplate/java/order-service
mvn test -Dtest=TotpSecretTest
```
Expected: FAIL

**Java Step 3: Write minimal implementation**

```java
// src/main/java/com/example/orderservice/domain/models/TotpSecret.java
package com.example.orderservice.domain.models;

import java.util.regex.Pattern;

public final class TotpSecret {
    private static final Pattern BASE32_PATTERN = Pattern.compile("^[A-Z2-7]+=*$");
    
    private final String secret;
    private final boolean verified;
    
    public TotpSecret(String secret) {
        this(secret, false);
    }
    
    public TotpSecret(String secret, boolean verified) {
        if (!BASE32_PATTERN.matcher(secret).matches()) {
            throw new IllegalArgumentException("Secret must be valid Base32 encoded string");
        }
        this.secret = secret;
        this.verified = verified;
    }
    
    public String getSecret() {
        return secret;
    }
    
    public boolean isVerified() {
        return verified;
    }
    
    public TotpSecret markVerified() {
        return new TotpSecret(this.secret, true);
    }
}
```

**Java Step 4: Run test to verify pass**

```bash
mvn test -Dtest=TotpSecretTest
```
Expected: PASS

**Java Step 5: Commit**

```bash
git add src/main/java/com/example/orderservice/domain/models/TotpSecret.java src/test/java/com/example/orderservice/domain/models/TotpSecretTest.java
git commit -m "feat(domain): add TotpSecret value object"
```

---

### Task 1.3: Create BackupCode value object

**Objective:** Immutable backup code with hash for secure storage

**Files:**
- Create: `boilerplate/python/order-service/src/domain/models/backup_code.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/models/BackupCode.java`

**Python Step 1: Write failing test**

```python
# tests/domain/models/test_backup_code.py
from domain.models.backup_code import BackupCode

def test_backup_code_creation():
    code = BackupCode("ABCD-1234-EFGH-5678")
    assert code.code == "ABCD-1234-EFGH-5678"
    assert code.used is False
    assert code.hashed_code is not None
    assert len(code.hashed_code) > 0

def test_backup_code_mark_used():
    code = BackupCode("ABCD-1234-EFGH-5678")
    used = code.mark_used()
    assert used.used is True
    assert code.used is False  # immutable
```

**Python Step 2: Run test to verify failure**

```bash
cd boilerplate/python/order-service
pytest tests/domain/models/test_backup_code.py -v
```
Expected: FAIL

**Python Step 3: Write minimal implementation**

```python
# src/domain/models/backup_code.py
from dataclasses import dataclass, field
import hashlib


@dataclass(frozen=True)
class BackupCode:
    """Backup code value object.
    
    Immutable (frozen) with hashed storage for security.
    Code format: XXXX-XXXX-XXXX-XXXX (16 chars, dash-separated)
    """
    
    code: str
    used: bool = False
    hashed_code: str = field(init=False)
    
    def __post_init__(self):
        if not self._is_valid_format(self.code):
            raise ValueError("Backup code must be in XXXX-XXXX-XXXX-XXXX format")
        object.__setattr__(self, "hashed_code", self._hash_code(self.code))
    
    @staticmethod
    def _is_valid_format(code: str) -> bool:
        import re
        return bool(re.match(r'^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', code))
    
    @staticmethod
    def _hash_code(code: str) -> str:
        return hashlib.sha256(code.encode()).hexdigest()
    
    def mark_used(self) -> "BackupCode":
        return BackupCode(self.code, used=True)
```

**Python Step 4: Run test to verify pass**

```bash
pytest tests/domain/models/test_backup_code.py -v
```
Expected: PASS

**Python Step 5: Commit**

```bash
git add src/domain/models/backup_code.py tests/domain/models/test_backup_code.py
git commit -m "feat(domain): add BackupCode value object"
```

**Java Step 1-5: Similar pattern** (create BackupCode.java with SHA-256 hashing, validation)

---

### Task 1.4: Create WebAuthnCredential value object

**Objective:** Store WebAuthn credential data (credential ID, public key, counter)

**Files:**
- Create: `boilerplate/python/order-service/src/domain/models/webauthn_credential.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/models/WebAuthnCredential.java`

**Python Step 1: Write failing test**

```python
# tests/domain/models/test_webauthn_credential.py
from domain.models.webauthn_credential import WebAuthnCredential

def test_webauthn_credential_creation():
    cred = WebAuthnCredential(
        credential_id="cred-123",
        public_key="public-key-bytes",
        sign_count=0
    )
    assert cred.credential_id == "cred-123"
    assert cred.sign_count == 0
    assert cred.enabled is True

def test_webauthn_credential_update_counter():
    cred = WebAuthnCredential("cred-123", "pk", 5)
    updated = cred.update_sign_count(10)
    assert updated.sign_count == 10
    assert cred.sign_count == 5  # immutable
```

**Python Step 2-5: Implement and test** (similar pattern)

```python
# src/domain/models/webauthn_credential.py
from dataclasses import dataclass


@dataclass(frozen=True)
class WebAuthnCredential:
    """WebAuthn credential value object.
    
    Immutable (frozen) with counter update support.
    """
    
    credential_id: str
    public_key: str
    sign_count: int
    enabled: bool = True
    
    def __post_init__(self):
        if not self.credential_id:
            raise ValueError("Credential ID cannot be empty")
        if not self.public_key:
            raise ValueError("Public key cannot be empty")
        if self.sign_count < 0:
            raise ValueError("Sign count cannot be negative")
    
    def update_sign_count(self, new_count: int) -> "WebAuthnCredential":
        if new_count <= self.sign_count:
            raise ValueError("New sign count must be greater than current")
        return WebAuthnCredential(
            self.credential_id,
            self.public_key,
            new_count,
            self.enabled
        )
    
    def disable(self) -> "WebAuthnCredential":
        return WebAuthnCredential(
            self.credential_id,
            self.public_key,
            self.sign_count,
            enabled=False
        )
```

---

### Task 1.5: Create MfaConfig aggregate root

**Objective:** User's MFA configuration with multiple methods

**Files:**
- Create: `boilerplate/python/order-service/src/domain/models/mfa_config.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/models/MfaConfig.java`

**Python Step 1: Write failing test**

```python
# tests/domain/models/test_mfa_config.py
from uuid import uuid4
from domain.models.mfa_config import MfaConfig
from domain.models.totp_secret import TotpSecret
from domain.models.backup_code import BackupCode

def test_mfa_config_creation():
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    assert config.user_id == user_id
    assert config.enabled is False
    assert config.totp_secret is None
    assert config.backup_codes == []

def test_mfa_config_enable_totp():
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    config = config.with_totp(secret)
    assert config.enabled is True
    assert config.totp_secret.secret == "JBSWY3DPEHPK3PXP"

def test_mfa_config_generate_backup_codes():
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    config = config.with_backup_codes(10)
    assert len(config.backup_codes) == 10
    assert all(not code.used for code in config.backup_codes)
```

**Python Step 2-5: Implement MfaConfig**

```python
# src/domain/models/mfa_config.py
from dataclasses import dataclass, field
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
import secrets
import string

from .totp_secret import TotpSecret
from .backup_code import BackupCode
from .webauthn_credential import WebAuthnCredential


@dataclass(frozen=True)
class MfaConfig:
    """MFA configuration aggregate root.
    
    Immutable - all modifications return new instances.
    """
    
    user_id: UUID
    enabled: bool = False
    totp_secret: Optional[TotpSecret] = None
    backup_codes: List[BackupCode] = field(default_factory=list)
    webauthn_credentials: List[WebAuthnCredential] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    @staticmethod
    def create(user_id: UUID) -> "MfaConfig":
        return MfaConfig(user_id=user_id)
    
    def with_totp(self, secret: TotpSecret) -> "MfaConfig":
        return MfaConfig(
            user_id=self.user_id,
            enabled=True,
            totp_secret=secret,
            backup_codes=self.backup_codes,
            webauthn_credentials=self.webauthn_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def without_totp(self) -> "MfaConfig":
        return MfaConfig(
            user_id=self.user_id,
            enabled=self._recalculate_enabled(
                has_totp=False,
                has_webauthn=len(self.webauthn_credentials) > 0,
                has_backup_codes=any(not c.used for c in self.backup_codes)
            ),
            totp_secret=None,
            backup_codes=self.backup_codes,
            webauthn_credentials=self.webauthn_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def with_backup_codes(self, count: int = 10) -> "MfaConfig":
        codes = self._generate_backup_codes(count)
        return MfaConfig(
            user_id=self.user_id,
            enabled=True,
            totp_secret=self.totp_secret,
            backup_codes=codes,
            webauthn_credentials=self.webauthn_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def with_webauthn_credential(self, credential: WebAuthnCredential) -> "MfaConfig":
        new_credentials = self.webauthn_credentials + [credential]
        return MfaConfig(
            user_id=self.user_id,
            enabled=True,
            totp_secret=self.totp_secret,
            backup_codes=self.backup_codes,
            webauthn_credentials=new_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def _recalculate_enabled(
        self,
        has_totp: bool,
        has_webauthn: bool,
        has_backup_codes: bool
    ) -> bool:
        return has_totp or has_webauthn or has_backup_codes
    
    @staticmethod
    def _generate_backup_codes(count: int) -> List[BackupCode]:
        chars = string.ascii_uppercase + string.digits
        codes = []
        for _ in range(count):
            parts = [
                ''.join(secrets.choice(chars) for _ in range(4))
                for _ in range(4)
            ]
            code = '-'.join(parts)
            codes.append(BackupCode(code))
        return codes
```

---

## Phase 2: Domain Ports (Repository Interfaces)

### Task 2.1: Create MfaConfigRepository port

**Objective:** Define repository interface for MFA config persistence

**Files:**
- Create: `boilerplate/python/order-service/src/domain/ports/mfa_config_repository.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/ports/MfaConfigRepository.java`

**Python:**

```python
# src/domain/ports/mfa_config_repository.py
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.models.mfa_config import MfaConfig


class MfaConfigRepository(ABC):
    """Repository port for MFA configuration persistence."""
    
    @abstractmethod
    def save(self, config: MfaConfig) -> MfaConfig:
        """Persist MFA configuration."""
        ...
    
    @abstractmethod
    def find_by_user_id(self, user_id: UUID) -> Optional[MfaConfig]:
        """Find MFA config by user ID."""
        ...
    
    @abstractmethod
    def exists_by_user_id(self, user_id: UUID) -> bool:
        """Check if MFA config exists for user."""
        ...
    
    @abstractmethod
    def delete_by_user_id(self, user_id: UUID) -> None:
        """Delete MFA configuration for user."""
        ...
```

**Java:** Similar interface pattern

---

## Phase 3: Application Layer (Use Cases)

### Task 3.1: Create GenerateTotpSecret use case

**Objective:** Generate TOTP secret for user

**Files:**
- Create: `boilerplate/python/order-service/src/application/usecases/generate_totp_secret.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/application/usecases/GenerateTotpSecretUseCase.java`

---

### Task 3.2: Create VerifyTotpCode use case

**Objective:** Verify TOTP code during setup and login

---

### Task 3.3: Create EnableMfa use case

**Objective:** Enable MFA for user with chosen method

---

### Task 3.4: Create DisableMfa use case

**Objective:** Disable MFA for user

---

### Task 3.5: Create GenerateBackupCodes use case

**Objective:** Generate new backup codes

---

### Task 3.6: Create VerifyBackupCode use case

**Objective:** Verify and consume backup code

---

### Task 3.7: Create RegisterWebAuthnCredential use case

**Objective:** Register new WebAuthn credential

---

### Task 3.8: Create AuthenticateWithMfa use case

**Objective:** Authenticate user with MFA verification

---

## Phase 4: Infrastructure Layer

### Task 4.1: Add Python dependencies

**Objective:** Add pyotp, webauthn to pyproject.toml

**Files:**
- Modify: `boilerplate/python/order-service/pyproject.toml`

```toml
[tool.poetry.dependencies]
pyotp = "^2.9"
webauthn = "^2.0"
cryptography = "^42.0"
```

**Step: Install dependencies**

```bash
cd boilerplate/python/order-service
poetry install
```

---

### Task 4.2: Add Java dependencies

**Objective:** Add webauthn4j, totp to pom.xml

**Files:**
- Modify: `boilerplate/java/order-service/pom.xml`

```xml
<dependencies>
    <dependency>
        <groupId>com.webauthn4j</groupId>
        <artifactId>webauthn4j-core</artifactId>
        <version>0.21.0.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>dev.topham</groupId>
        <artifactId>totp</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

---

### Task 4.3: Create TOTP service implementation

**Objective:** Implement TOTP generation and verification

**Files:**
- Create: `boilerplate/python/order-service/src/infrastructure/services/totp_service.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/services/TotpService.java`

**Python:**

```python
# src/infrastructure/services/totp_service.py
import pyotp
import base64


class TotpService:
    """TOTP generation and verification using pyotp."""
    
    def __init__(self, issuer: str = "MyApp"):
        self._issuer = issuer
    
    def generate_secret(self) -> str:
        """Generate random Base32 secret."""
        return pyotp.random_base32()
    
    def get_provisioning_uri(self, secret: str, user_email: str) -> str:
        """Generate QR code provisioning URI."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=user_email, issuer_name=self._issuer)
    
    def verify_code(self, secret: str, code: str) -> bool:
        """Verify TOTP code."""
        totp = pyotp.TOTP(secret)
        return totp.verify(code)
```

---

### Task 4.4: Create WebAuthn service implementation

**Objective:** Implement WebAuthn registration and authentication

**Files:**
- Create: `boilerplate/python/order-service/src/infrastructure/services/webauthn_service.py`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/services/WebAuthnService.java`

---

### Task 4.5: Create MFA config repository implementation (SQLAlchemy)

**Objective:** Implement MFA config persistence with SQLAlchemy

**Files:**
- Create: `boilerplate/python/order-service/src/infrastructure/persistence/mfa_config_entity.py`
- Create: `boilerplate/python/order-service/src/infrastructure/persistence/sqlalchemy_mfa_repository.py`

---

### Task 4.6: Create MFA config repository implementation (JPA)

**Objective:** Implement MFA config persistence with JPA

**Files:**
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/persistence/MfaConfigEntity.java`
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/persistence/JpaMfaConfigRepository.java`

---

## Phase 5: API Layer (REST Endpoints)

### Task 5.1: Create MFA controller (Python FastAPI)

**Objective:** REST endpoints for MFA operations

**Files:**
- Create: `boilerplate/python/order-service/src/infrastructure/api/mfa_controller.py`

**Endpoints:**
- `POST /api/mfa/totp/generate` - Generate TOTP secret
- `POST /api/mfa/totp/verify` - Verify TOTP code
- `POST /api/mfa/enable` - Enable MFA
- `POST /api/mfa/disable` - Disable MFA
- `POST /api/mfa/backup-codes/generate` - Generate backup codes
- `POST /api/mfa/backup-codes/verify` - Verify backup code
- `POST /api/mfa/webauthn/register/start` - Start WebAuthn registration
- `POST /api/mfa/webauthn/register/complete` - Complete WebAuthn registration
- `POST /api/mfa/webauthn/authenticate/start` - Start WebAuthn auth
- `POST /api/mfa/webauthn/authenticate/complete` - Complete WebAuthn auth

---

### Task 5.2: Create MFA controller (Java Spring)

**Objective:** REST endpoints for MFA operations

**Files:**
- Create: `boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/api/MfaController.java`

---

## Phase 6: Database Migrations

### Task 6.1: Create Alembic migration (Python)

**Objective:** Database schema for MFA tables

**Files:**
- Create: `boilerplate/python/order-service/alembic/versions/XXXX_add_mfa_tables.py`

**Tables:**
- `mfa_configs` - user_id, enabled, totp_secret, created_at, updated_at
- `backup_codes` - mfa_config_id, hashed_code, used, created_at
- `webauthn_credentials` - mfa_config_id, credential_id, public_key, sign_count, enabled

---

### Task 6.2: Create Flyway migration (Java)

**Objective:** Database schema for MFA tables

**Files:**
- Create: `boilerplate/java/order-service/src/main/resources/db/migration/V2__add_mfa_tables.sql`

---

## Phase 7: Integration Tests

### Task 7.1: Create Python integration tests with Testcontainers

**Objective:** Test MFA flows with real PostgreSQL

**Files:**
- Create: `boilerplate/python/order-service/tests/integration/test_mfa_integration.py`

**Tests:**
- Test TOTP generation and verification
- Test backup code generation and verification
- Test MFA enable/disable flow
- Test WebAuthn registration (mocked)

---

### Task 7.2: Create Java integration tests with Testcontainers

**Objective:** Test MFA flows with real PostgreSQL

**Files:**
- Create: `boilerplate/java/order-service/src/test/java/com/example/orderservice/infrastructure/persistence/MfaConfigRepositoryTestcontainersTest.java`

---

## Phase 8: Documentation

### Task 8.1: Update AGENTS.md

**Objective:** Document MFA patterns and usage

**Files:**
- Modify: `boilerplate/python/AGENTS.md`
- Modify: `boilerplate/java/AGENTS.md`

---

### Task 8.2: Create MFA SOP

**Objective:** Standard operating procedure for MFA features

**Files:**
- Create: `docs/04-sops/06-implement-mfa-feature.md`

---

## Verification Checklist

Before marking complete:

- [ ] All domain models created with TDD
- [ ] All use cases implemented with TDD
- [ ] Repository interfaces and implementations complete
- [ ] REST endpoints functional (test with curl/Postman)
- [ ] Database migrations run successfully
- [ ] Integration tests pass with Testcontainers
- [ ] Architecture validation passes (no forbidden imports)
- [ ] Documentation updated
- [ ] No temporary files in repository

---

## Dependencies Summary

**Python:**
```toml
[tool.poetry.dependencies]
pyotp = "^2.9"
webauthn = "^2.0"
cryptography = "^42.0"
```

**Java:**
```xml
<dependency>
    <groupId>com.webauthn4j</groupId>
    <artifactId>webauthn4j-core</artifactId>
    <version>0.21.0.RELEASE</version>
</dependency>
<dependency>
    <groupId>dev.topham</groupId>
    <artifactId>totp</artifactId>
    <version>1.0.0</version>
</dependency>
```

---

*Plan saved: 2026-05-25*
