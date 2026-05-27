#!/usr/bin/env bash
#
# New Project Setup Wizard
# =========================
# Interactive script to create a new project from this template.
# Copies selected boilerplates, generates .env, and configures Docker Compose.
#
# Usage: ./scripts/new-project.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Get script directory (works from any location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")"

print_header "🚀 New Project Setup Wizard"
echo ""
echo "This wizard will help you create a new project from the template."
echo "Answer the questions below to configure your project."
echo ""

# =============================================================================
# Step 1: Project Identity
# =============================================================================
print_header "Step 1: Project Identity"
echo ""

read -p "Project name (e.g., order-service, inventory-management): " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
    print_error "Project name is required"
    exit 1
fi

read -p "Service prefix (e.g., order, inventory, user): " SERVICE_PREFIX
if [ -z "$SERVICE_PREFIX" ]; then
    print_error "Service prefix is required"
    exit 1
fi

read -p "Repository URL (optional, e.g., https://github.com/your-org/$PROJECT_NAME): " REPO_URL

print_step "Project: $PROJECT_NAME (prefix: $SERVICE_PREFIX)"

# =============================================================================
# Step 2: Backend Stack Selection
# =============================================================================
echo ""
print_header "Step 2: Backend Stack"
echo ""
echo "Select your backend technology:"
echo "  [1] Java (Spring Boot 3.4+ with PostgreSQL, Maven, ArchUnit)"
echo "  [2] Python (FastAPI with PostgreSQL, Poetry, pytest)"
echo "  [3] Both (Polyglot architecture)"
echo ""

read -p "Select [1-3]: " BACKEND_CHOICE

case $BACKEND_CHOICE in
    1)
        BACKEND_STACK="java"
        print_step "Backend: Java (Spring Boot)"
        ;;
    2)
        BACKEND_STACK="python"
        print_step "Backend: Python (FastAPI)"
        ;;
    3)
        BACKEND_STACK="both"
        print_step "Backend: Both (Java + Python)"
        ;;
    *)
        print_error "Invalid selection. Must be 1, 2, or 3."
        exit 1
        ;;
esac

# =============================================================================
# Step 3: Frontend Stack Selection
# =============================================================================
echo ""
print_header "Step 3: Frontend Stack"
echo ""
echo "Select your frontend technology:"
echo "  [1] ReactJS (React 18, TypeScript, Ant Design 5, Zustand, Vite)"
echo "  [2] Quasar (Vue 3, TypeScript, Quasar 2, Pinia, Vite)"
echo "  [3] None (API only)"
echo ""

read -p "Select [1-3]: " FRONTEND_CHOICE

case $FRONTEND_CHOICE in
    1)
        FRONTEND_STACK="reactjs"
        print_step "Frontend: ReactJS"
        ;;
    2)
        FRONTEND_STACK="quasar"
        print_step "Frontend: Quasar"
        ;;
    3)
        FRONTEND_STACK="none"
        print_step "Frontend: None (API only)"
        ;;
    *)
        print_error "Invalid selection. Must be 1, 2, or 3."
        exit 1
        ;;
esac

# =============================================================================
# Step 4: Security Configuration
# =============================================================================
echo ""
print_header "Step 4: Security Configuration"
echo ""

read -p "Enable MFA/2FA? [y/N]: " ENABLE_MFA_INPUT
ENABLE_MFA=$([ "$ENABLE_MFA_INPUT" = "y" ] || [ "$ENABLE_MFA_INPUT" = "Y" ] && echo "true" || echo "false")

if [ "$ENABLE_MFA" = "true" ]; then
    echo ""
    echo "Select MFA methods:"
    echo "  [1] TOTP (Google Authenticator, Authy)"
    echo "  [2] WebAuthn (Hardware keys, biometrics)"
    echo "  [3] Both"
    echo ""
    read -p "Select [1-3]: " MFA_CHOICE
    
    case $MFA_CHOICE in
        1) MFA_METHODS="totp" ;;
        2) MFA_METHODS="webauthn" ;;
        3) MFA_METHODS="totp,webauthn" ;;
        *) MFA_METHODS="totp" ;;
    esac
    print_step "MFA: $MFA_METHODS"
else
    MFA_METHODS="none"
    print_step "MFA: Disabled"
fi

read -p "JWT expiry minutes [60]: " JWT_EXPIRY
JWT_EXPIRY=${JWT_EXPIRY:-60}

read -p "Rate limiting enabled? [y/N]: " RATE_LIMIT_INPUT
ENABLE_RATE_LIMIT=$([ "$RATE_LIMIT_INPUT" = "y" ] || [ "$RATE_LIMIT_INPUT" = "Y" ] && echo "true" || echo "false")

# =============================================================================
# Step 5: Database Configuration
# =============================================================================
echo ""
print_header "Step 5: Database Configuration"
echo ""

read -p "Database name [${SERVICE_PREFIX}_db]: " DB_NAME
DB_NAME=${DB_NAME:-${SERVICE_PREFIX}_db}

read -p "Database user [app_user]: " DB_USER
DB_USER=${DB_USER:-app_user}

# Generate secure password if not provided
read -p "Generate secure database password? [Y/n]: " GEN_PASS_INPUT
if [ "$GEN_PASS_INPUT" = "n" ] || [ "$GEN_PASS_INPUT" = "N" ]; then
    read -sp "Database password: " DB_PASSWORD
    echo ""
else
    DB_PASSWORD=$(openssl rand -base64 32)
    print_step "Generated secure database password"
fi

# =============================================================================
# Step 6: Deployment Configuration
# =============================================================================
echo ""
print_header "Step 6: Deployment Mode"
echo ""
echo "Select deployment strategy:"
echo "  [1] Fleet Mode (Traefik + TLS + Tailscale)"
echo "  [2] Standalone Mode (direct localhost ports)"
echo "  [3] Hybrid (Fleet for prod, Standalone for dev)"
echo ""

read -p "Select [1-3]: " DEPLOY_MODE

case $DEPLOY_MODE in
    1)
        DEPLOY_MODE_NAME="fleet"
        read -p "Tailscale hostname (e.g., $SERVICE_PREFIX.piranha-broadnose.ts.net): " TRAEFIK_HOST
        print_step "Deployment: Fleet (Traefik + TLS)"
        ;;
    2)
        DEPLOY_MODE_NAME="standalone"
        print_step "Deployment: Standalone (localhost)"
        ;;
    3)
        DEPLOY_MODE_NAME="hybrid"
        read -p "Tailscale hostname for production: " TRAEFIK_HOST
        print_step "Deployment: Hybrid"
        ;;
    *)
        print_error "Invalid selection. Must be 1, 2, or 3."
        exit 1
        ;;
esac

# =============================================================================
# Step 7: Monitoring Configuration
# =============================================================================
echo ""
print_header "Step 7: Monitoring & Observability"
echo ""

read -p "Enable Prometheus metrics? [Y/n]: " METRICS_INPUT
ENABLE_METRICS=$([ "$METRICS_INPUT" = "n" ] || [ "$METRICS_INPUT" = "N" ] && echo "false" || echo "true")

read -p "Enable distributed tracing? [y/N]: " TRACING_INPUT
ENABLE_TRACING=$([ "$TRACING_INPUT" = "y" ] || [ "$TRACING_INPUT" = "Y" ] && echo "true" || echo "false")

if [ "$ENABLE_TRACING" = "true" ]; then
    read -p "Jaeger/Zipkin endpoint: " TRACING_ENDPOINT
fi

# =============================================================================
# Generate Project
# =============================================================================
echo ""
print_header "Generating Project"
echo ""

# Determine output directory
PARENT_DIR="$(dirname "$TEMPLATE_DIR")"
PROJECT_DIR="$PARENT_DIR/$PROJECT_NAME"

# Check if directory already exists
if [ -d "$PROJECT_DIR" ]; then
    print_error "Directory already exists: $PROJECT_DIR"
    read -p "Overwrite? [y/N]: " OVERWRITE
    if [ "$OVERWRITE" = "y" ] || [ "$OVERWRITE" = "Y" ]; then
        rm -rf "$PROJECT_DIR"
        print_step "Removed existing directory"
    else
        print_error "Aborted"
        exit 1
    fi
fi

# Create project directory
mkdir -p "$PROJECT_DIR"
print_step "Created: $PROJECT_DIR"

# Copy selected boilerplates
echo ""
print_info "Copying boilerplate code..."

if [ "$BACKEND_STACK" = "java" ] || [ "$BACKEND_STACK" = "both" ]; then
    cp -r "$TEMPLATE_DIR/boilerplate/java" "$PROJECT_DIR/"
    print_step "  ✓ Java boilerplate"
fi

if [ "$BACKEND_STACK" = "python" ] || [ "$BACKEND_STACK" = "both" ]; then
    cp -r "$TEMPLATE_DIR/boilerplate/python" "$PROJECT_DIR/"
    print_step "  ✓ Python boilerplate"
fi

if [ "$FRONTEND_STACK" = "reactjs" ]; then
    cp -r "$TEMPLATE_DIR/boilerplate/reactjs" "$PROJECT_DIR/"
    print_step "  ✓ ReactJS boilerplate"
fi

if [ "$FRONTEND_STACK" = "quasar" ]; then
    cp -r "$TEMPLATE_DIR/boilerplate/quasar" "$PROJECT_DIR/"
    print_step "  ✓ Quasar boilerplate"
fi

# Copy core files
cp "$TEMPLATE_DIR/docker-compose.yml" "$PROJECT_DIR/"
cp "$TEMPLATE_DIR/docker-compose.standalone.yml" "$PROJECT_DIR/"
cp "$TEMPLATE_DIR/docker-compose.traefik.yml" "$PROJECT_DIR/"
cp "$TEMPLATE_DIR/.env.example" "$PROJECT_DIR/.env.template"
cp "$TEMPLATE_DIR/README.md" "$PROJECT_DIR/"
cp -r "$TEMPLATE_DIR/docs" "$PROJECT_DIR/" 2>/dev/null || true
cp -r "$TEMPLATE_DIR/scripts" "$PROJECT_DIR/" 2>/dev/null || true

print_step "  ✓ Core files (docker-compose, README, docs, scripts)"

# Generate .env file
echo ""
print_info "Generating .env configuration..."

cat > "$PROJECT_DIR/.env" <<EOF
# =============================================================================
# Project Configuration
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

# Project Identity
PROJECT_NAME=$PROJECT_NAME
SERVICE_PREFIX=$SERVICE_PREFIX
REPO_URL=$REPO_URL

# =============================================================================
# Database Configuration
# =============================================================================
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_HOST=${SERVICE_PREFIX}-postgres
POSTGRES_PORT=5432

# =============================================================================
# JWT Configuration
# =============================================================================
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRY_MINUTES=$JWT_EXPIRY
JWT_ALGORITHM=HS256

# =============================================================================
# Security Features
# =============================================================================
ENABLE_MFA=$ENABLE_MFA
MFA_METHODS=$MFA_METHODS
ENABLE_RATE_LIMIT=$ENABLE_RATE_LIMIT
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# =============================================================================
# Deployment Configuration
# =============================================================================
DEPLOY_MODE=$DEPLOY_MODE_NAME
EOF

if [ "$DEPLOY_MODE_NAME" = "fleet" ] || [ "$DEPLOY_MODE_NAME" = "hybrid" ]; then
    cat >> "$PROJECT_DIR/.env" <<EOF

# Traefik (Fleet mode)
TRAEFIK_HOST=$TRAEFIK_HOST
EOF
fi

cat >> "$PROJECT_DIR/.env" <<EOF

# =============================================================================
# Monitoring & Observability
# =============================================================================
ENABLE_METRICS=$ENABLE_METRICS
ENABLE_TRACING=$ENABLE_TRACING
EOF

if [ "$ENABLE_TRACING" = "true" ]; then
    echo "TRACING_ENDPOINT=$TRACING_ENDPOINT" >> "$PROJECT_DIR/.env"
fi

print_step "Generated: .env"

# Rename services in docker-compose files
echo ""
print_info "Configuring Docker Compose files..."

# Replace service names with project-specific prefix
for compose_file in "$PROJECT_DIR"/docker-compose*.yml; do
    if [ -f "$compose_file" ]; then
        # Replace generic service names with project-specific ones
        sed -i.bak "s/order-${SERVICE_PREFIX}/${SERVICE_PREFIX}/g" "$compose_file"
        sed -i.bak "s/order-service/${SERVICE_PREFIX}-service/g" "$compose_file"
        sed -i.bak "s/order-java/${SERVICE_PREFIX}-java/g" "$compose_file"
        sed -i.bak "s/order-python/${SERVICE_PREFIX}-python/g" "$compose_file"
        sed -i.bak "s/order-frontend/${SERVICE_PREFIX}-frontend/g" "$compose_file"
        sed -i.bak "s/order-postgres/${SERVICE_PREFIX}-postgres/g" "$compose_file"
        sed -i.bak "s/order-redis/${SERVICE_PREFIX}-redis/g" "$compose_file"
        rm -f "${compose_file}.bak"
    fi
done

print_step "Updated service names in docker-compose files"

# Create project-specific README
cat > "$PROJECT_DIR/PROJECT_SETUP.md" <<EOF
# $PROJECT_NAME - Project Setup

**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")  
**Template:** app-architecture-template  
**Service Prefix:** $SERVICE_PREFIX

---

## 🚀 Quick Start

### 1. Review Configuration

Check the \`.env\` file and update if needed:
\`\`\`bash
cat .env
\`\`\`

**Important:** Update the database password if you want to set a custom one.

### 2. Start Services

**Standalone Mode:**
\`\`\`bash
docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d
\`\`\`

**Fleet Mode (with Traefik):**
\`\`\`bash
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
\`\`\`

### 3. Verify Services

**Java Backend:** http://localhost:8080/actuator/health  
**Python Backend:** http://localhost:8081/health  
**Frontend:** http://localhost/

### 4. Access Documentation

**Java API Docs:** http://localhost:8080/swagger-ui.html  
**Python API Docs:** http://localhost:8081/docs

---

## 📋 Configuration Summary

| Setting | Value |
|---------|-------|
| **Project Name** | $PROJECT_NAME |
| **Service Prefix** | $SERVICE_PREFIX |
| **Backend** | $BACKEND_STACK |
| **Frontend** | $FRONTEND_STACK |
| **MFA Enabled** | $ENABLE_MFA |
| **MFA Methods** | $MFA_METHODS |
| **JWT Expiry** | $JWT_EXPIRY minutes |
| **Deployment** | $DEPLOY_MODE_NAME |
| **Database** | $DB_NAME |

---

## 🔧 Next Steps

1. **Initialize Git repository:**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit: Project setup from template"
   \`\`\`

2. **Create GitHub repository:**
   \`\`\`bash
   gh repo create $SERVICE_PREFIX-$PROJECT_NAME --public --source=. --remote=origin --push
   \`\`\`

3. **Run architecture validation:**
   \`\`\`bash
   ./scripts/architecture-pre-commit.sh
   \`\`\`

4. **Start development:**
   - Read boilerplate AGENTS.md for your stack
   - Follow quick-start guides in docs/quick-start/
   - Create first GitHub Issue for your feature

---

## 📚 Documentation

- **Root README:** [README.md](README.md)
- **Quick Start Guides:** [docs/quick-start/](docs/quick-start/)
- **Architecture Standards:** [docs/01-agnostic/01-standards/](docs/01-agnostic/01-standards/)
- **SOPs:** [docs/04-sops/](docs/04-sops/)

---

**Need help?** See [docs/quick-start/01-developer-onboarding.md](docs/quick-start/01-developer-onboarding.md)
EOF

print_step "Created: PROJECT_SETUP.md"

# Initialize Git repository
echo ""
print_info "Initializing Git repository..."
cd "$PROJECT_DIR"
git init -q
git add .
git commit -q -m "Initial commit: Project setup from template

Project: $PROJECT_NAME
Backend: $BACKEND_STACK
Frontend: $FRONTEND_STACK
Deployment: $DEPLOY_MODE_NAME

Generated by: scripts/new-project.sh"

print_step "Git repository initialized"

# =============================================================================
# Summary
# =============================================================================
echo ""
print_header "✅ Project Created Successfully!"
echo ""
echo "Project Directory: $PROJECT_DIR"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Review .env file (especially database password)"
echo "  3. docker compose up -d"
echo "  4. Open PROJECT_SETUP.md for detailed instructions"
echo ""

if [ "$DEPLOY_MODE_NAME" = "fleet" ] || [ "$DEPLOY_MODE_NAME" = "hybrid" ]; then
    echo "Fleet Mode URLs:"
    echo "  - Java:  https://$TRAEFIK_HOST/${SERVICE_PREFIX}-java/"
    echo "  - Python: https://$TRAEFIK_HOST/${SERVICE_PREFIX}-python/"
    echo "  - Frontend: https://$TRAEFIK_HOST/"
else
    echo "Standalone Mode URLs:"
    echo "  - Java:  http://localhost:8080/actuator/health"
    echo "  - Python: http://localhost:8081/health"
    echo "  - Frontend: http://localhost/"
fi

echo ""
print_info "Happy coding! 🚀"
echo ""
