---
name: "Configuration Guidelines"
type: "Guideline"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Configuration Guidelines

This document provides guidelines on where to store different types of configuration and constants within the application.

## Hardcoded Constants
Items that are very seldomly changed and are intrinsic to the application's logic should be placed in a centralized `Constant` class.

**Examples:**
- Job names
- Service names
- Internal system identifiers

## Application Properties / YAML
Items that might change between environments or occasionally during the application's lifecycle should be placed in centralized application properties (e.g., `application.yml`, `settings.py`).

**Examples:**
- Error messages
- Job chunk sizes
- Timeout settings
- Feature flags (static)

## Database Configuration
Items that power users and administrators need to change frequently without redeploying the application should be stored in a database configuration table. These should typically support effective dates for versioning.

**Examples:**
- Business rules
- Thresholds for alerts
- Operational parameters adjusted by admins
- System-wide settings with audit trails
