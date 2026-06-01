#!/usr/bin/env bash
#
# New Project Setup Wizard
# =========================
# Interactive script to create a new project from this template.
# Copies selected boilerplates, generates .env, and configures Docker Compose.
#
# Usage: ./scripts/new-project.sh [OPTIONS]
#
# Options:
#   --help, -h          Show this help message and exit
#   --dry-run           Show what would be created without creating anything
#   --config FILE       Load configuration from JSON file
#   --save-config FILE  Save configuration to JSON file after completion
#   --no-color          Disable colored output
#   --yes, -y           Accept defaults without prompting (requires --config)
#
# Requirements:
#   - Bash 4.0+
#   - Standard Unix tools (cp, sed, mkdir, openssl, jq for config files)
#   - Interactive terminal (unless using --config with --yes)
#
# What it does:
#   1. Asks ~15 questions about your project requirements
#   2. Copies only the boilerplates you select (Java/Python/React/Quasar)
#   3. Generates a customized .env file with secure passwords
#   4. Renames services in Docker Compose files
#   5. Initializes a Git repository with first commit
#   6. Creates project_setup.md with project-specific instructions
#
# Output:
#   Creates a new project directory in the parent folder:
#   ../<project-name>/
#
# Examples:
#   # Interactive mode (default)
#   $ ./scripts/new-project.sh
#
#   # Show help
#   $ ./scripts/new-project.sh --help
#
#   # Dry run (preview only)
#   $ ./scripts/new-project.sh --dry-run
#
#   # Load from config file
#   $ ./scripts/new-project.sh --config my-project.json
#
#   # Save config after completion
#   $ ./scripts/new-project.sh --save-config my-project.json
#
#   # Non-interactive with config
#   $ ./scripts/new-project.sh --config my-project.json --yes
#
# Config File Format (JSON):
# {
#   "project_name": "order-service",
#   "service_prefix": "order",
#   "repo_url": "https://github.com/org/order-service",
#   "backend_stack": "java",
#   "frontend_stack": "reactjs",
#   "enable_mfa": true,
#   "mfa_methods": "totp",
#   "jwt_expiry": 60,
#   "enable_rate_limit": false,
#   "db_name": "order_db",
#   "db_user": "app_user",
#   "generate_password": true,
#   "deploy_mode": "standalone",
#   "traefik_host": "order.example.com",
#   "enable_metrics": true,
#   "enable_tracing": false
# }
#

set -e

# Default values
DRY_RUN=false
CONFIG_FILE=""
SAVE_CONFIG_FILE=""
NO_COLOR=false
YES_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            # Extract and display help from file header
            sed -n '2,/^$/p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --save-config)
            SAVE_CONFIG_FILE="$2"
            shift 2
            ;;
        --no-color)
            NO_COLOR=true
            shift
            ;;
        --yes|-y)
            YES_MODE=true
            shift
            ;;
        *)
            echo "Error: Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Colors for output
if [ "$NO_COLOR" = true ]; then
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
else
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
fi

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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Get script directory (works from any location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")"

# Load configuration from file if provided
if [ -n "$CONFIG_FILE" ]; then
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Config file not found: $CONFIG_FILE"
        exit 1
    fi
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_error "jq is required for config file support. Install with: apt install jq"
        exit 1
    fi
    
    print_info "Loading configuration from: $CONFIG_FILE"
    
    # Load values from JSON config
    PROJECT_NAME=$(jq -r '.project_name // empty' "$CONFIG_FILE")
    SERVICE_PREFIX=$(jq -r '.service_prefix // empty' "$CONFIG_FILE")
    REPO_URL=$(jq -r '.repo_url // empty' "$CONFIG_FILE")
    BACKEND_STACK=$(jq -r '.backend_stack // empty' "$CONFIG_FILE")
    FRONTEND_STACK=$(jq -r '.frontend_stack // empty' "$CONFIG_FILE")
    ENABLE_MFA=$(jq -r '.enable_mfa // false' "$CONFIG_FILE")
    MFA_METHODS=$(jq -r '.mfa_methods // "totp"' "$CONFIG_FILE")
    JWT_EXPIRY=$(jq -r '.jwt_expiry // 60' "$CONFIG_FILE")
    ENABLE_RATE_LIMIT=$(jq -r '.enable_rate_limit // false' "$CONFIG_FILE")
    DB_NAME=$(jq -r '.db_name // empty' "$CONFIG_FILE")
    DB_USER=$(jq -r '.db_user // "app_user"' "$CONFIG_FILE")
    GENERATE_PASSWORD=$(jq -r '.generate_password // true' "$CONFIG_FILE")
    DEPLOY_MODE_NAME=$(jq -r '.deploy_mode // "standalone"' "$CONFIG_FILE")
    TRAEFIK_HOST=$(jq -r '.traefik_host // empty' "$CONFIG_FILE")
    ENABLE_METRICS=$(jq -r '.enable_metrics // true' "$CONFIG_FILE")
    ENABLE_TRACING=$(jq -r '.enable_tracing // false' "$CONFIG_FILE")
    TRACING_ENDPOINT=$(jq -r '.tracing_endpoint // empty' "$CONFIG_FILE")
    
    # Convert string values to menu selections
    case $BACKEND_STACK in
        java) BACKEND_CHOICE=1 ;;
        python) BACKEND_CHOICE=2 ;;
        both) BACKEND_CHOICE=3 ;;
        *) BACKEND_CHOICE="" ;;
    esac
    
    case $FRONTEND_STACK in
        reactjs) FRONTEND_CHOICE=1 ;;
        quasar) FRONTEND_CHOICE=2 ;;
        none) FRONTEND_CHOICE=3 ;;
        *) FRONTEND_CHOICE="" ;;
    esac
    
    case $DEPLOY_MODE_NAME in
        fleet) DEPLOY_MODE=1 ;;
        standalone) DEPLOY_MODE=2 ;;
        hybrid) DEPLOY_MODE=3 ;;
        *) DEPLOY_MODE="" ;;
    esac
    
    # Convert boolean strings
    [ "$ENABLE_MFA" = "true" ] && ENABLE_MFA_INPUT="y" || ENABLE_MFA_INPUT="n"
    [ "$ENABLE_RATE_LIMIT" = "true" ] && RATE_LIMIT_INPUT="y" || RATE_LIMIT_INPUT="n"
    [ "$GENERATE_PASSWORD" = "true" ] && GEN_PASS_INPUT="y" || GEN_PASS_INPUT="n"
    [ "$ENABLE_METRICS" = "true" ] && METRICS_INPUT="y" || METRICS_INPUT="n"
    [ "$ENABLE_TRACING" = "true" ] && TRACING_INPUT="y" || TRACING_INPUT="n"
    
    print_step "Configuration loaded successfully"
fi

# Check if running in non-interactive mode
if [ "$YES_MODE" = true ] && [ -z "$CONFIG_FILE" ]; then
    print_error "--yes mode requires --config FILE"
    exit 1
fi

if [ "$YES_MODE" = true ]; then
    NON_INTERACTIVE=true
elif [ ! -t 0 ]; then
    NON_INTERACTIVE=true
else
    NON_INTERACTIVE=false
fi

# Validate required config values when using --yes
if [ "$YES_MODE" = true ]; then
    missing_vars=()
    [ -z "$PROJECT_NAME" ] && missing_vars+=("project_name")
    [ -z "$SERVICE_PREFIX" ] && missing_vars+=("service_prefix")
    [ -z "$BACKEND_CHOICE" ] && missing_vars+=("backend_stack")
    [ -z "$FRONTEND_CHOICE" ] && missing_vars+=("frontend_stack")
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required config values: ${missing_vars[*]}"
        exit 1
    fi
fi

# Show header unless in dry-run mode
if [ "$DRY_RUN" = false ]; then
    print_header "🚀 New Project Setup Wizard"
    echo ""
    echo "This wizard will help you create a new project from the template."
    if [ "$NON_INTERACTIVE" = true ]; then
        echo "Running in non-interactive mode with configuration."
    else
        echo "Answer the questions below to configure your project."
    fi
    echo ""
fi

# =============================================================================
# Step 1: Project Identity
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    print_header "Step 1: Project Identity"
    echo ""
fi

if [ -z "$PROJECT_NAME" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        print_error "PROJECT_NAME not set in config"
        exit 1
    fi
    read -p "Project name (e.g., order-service, inventory-management): " PROJECT_NAME
fi

if [ -z "$PROJECT_NAME" ]; then
    print_error "Project name is required"
    exit 1
fi

if [ -z "$SERVICE_PREFIX" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        print_error "SERVICE_PREFIX not set in config"
        exit 1
    fi
    read -p "Service prefix (e.g., order, inventory, user): " SERVICE_PREFIX
fi

if [ -z "$SERVICE_PREFIX" ]; then
    print_error "Service prefix is required"
    exit 1
fi

if [ -z "$REPO_URL" ] && [ "$NON_INTERACTIVE" = false ]; then
    read -p "Repository URL (optional, e.g., https://github.com/your-org/$PROJECT_NAME): " REPO_URL
fi

if [ "$DRY_RUN" = false ]; then
    print_step "Project: $PROJECT_NAME (prefix: $SERVICE_PREFIX)"
fi

# =============================================================================
# Step 2: Backend Stack Selection
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    echo ""
    print_header "Step 2: Backend Stack"
    echo ""
fi

if [ -z "$BACKEND_CHOICE" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        print_error "BACKEND_STACK not set in config"
        exit 1
    fi
    echo "Select your backend technology:"
    echo "  [1] Java (Spring Boot 3.4+ with PostgreSQL, Maven, ArchUnit)"
    echo "  [2] Python (FastAPI with PostgreSQL, Poetry, pytest)"
    echo "  [3] Both (Polyglot architecture)"
    echo ""
    read -p "Select [1-3]: " BACKEND_CHOICE
fi

case $BACKEND_CHOICE in
    1)
        BACKEND_STACK="java"
        [ "$DRY_RUN" = false ] && print_step "Backend: Java (Spring Boot)"
        ;;
    2)
        BACKEND_STACK="python"
        [ "$DRY_RUN" = false ] && print_step "Backend: Python (FastAPI)"
        ;;
    3)
        BACKEND_STACK="both"
        [ "$DRY_RUN" = false ] && print_step "Backend: Both (Java + Python)"
        ;;
    *)
        print_error "Invalid backend selection. Must be 1, 2, or 3."
        exit 1
        ;;
esac

# =============================================================================
# Step 3: Frontend Stack Selection
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    echo ""
    print_header "Step 3: Frontend Stack"
    echo ""
fi

if [ -z "$FRONTEND_CHOICE" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        print_error "FRONTEND_STACK not set in config"
        exit 1
    fi
    echo "Select your frontend technology:"
    echo "  [1] ReactJS (React 18, TypeScript, Ant Design 5, Zustand, Vite)"
    echo "  [2] Quasar (Vue 3, TypeScript, Quasar 2, Pinia, Vite)"
    echo "  [3] None (API only)"
    echo ""
    read -p "Select [1-3]: " FRONTEND_CHOICE
fi

case $FRONTEND_CHOICE in
    1)
        FRONTEND_STACK="reactjs"
        [ "$DRY_RUN" = false ] && print_step "Frontend: ReactJS"
        ;;
    2)
        FRONTEND_STACK="quasar"
        [ "$DRY_RUN" = false ] && print_step "Frontend: Quasar"
        ;;
    3)
        FRONTEND_STACK="none"
        [ "$DRY_RUN" = false ] && print_step "Frontend: None (API only)"
        ;;
    *)
        print_error "Invalid frontend selection. Must be 1, 2, or 3."
        exit 1
        ;;
esac

# =============================================================================
# Step 4: Security Configuration
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    echo ""
    print_header "Step 4: Security Configuration"
    echo ""
fi

if [ -z "$ENABLE_MFA_INPUT" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        ENABLE_MFA_INPUT="n"
    else
        read -p "Enable MFA/2FA? [y/N]: " ENABLE_MFA_INPUT
    fi
fi

if [ -z "$ENABLE_MFA" ]; then
    ENABLE_MFA=$([ "$ENABLE_MFA_INPUT" = "y" ] || [ "$ENABLE_MFA_INPUT" = "Y" ] && echo "true" || echo "false")
fi

if [ "$ENABLE_MFA" = "true" ] && [ -z "$MFA_METHODS" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        MFA_METHODS="totp"
    else
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
    fi
    [ "$DRY_RUN" = false ] && print_step "MFA: $MFA_METHODS"
elif [ "$DRY_RUN" = false ]; then
    MFA_METHODS="none"
    print_step "MFA: Disabled"
fi

if [ -z "$JWT_EXPIRY" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        JWT_EXPIRY=60
    else
        read -p "JWT expiry minutes [60]: " JWT_EXPIRY
        JWT_EXPIRY=${JWT_EXPIRY:-60}
    fi
fi

if [ -z "$RATE_LIMIT_INPUT" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        RATE_LIMIT_INPUT="n"
    else
        read -p "Rate limiting enabled? [y/N]: " RATE_LIMIT_INPUT
    fi
fi

if [ -z "$ENABLE_RATE_LIMIT" ]; then
    ENABLE_RATE_LIMIT=$([ "$RATE_LIMIT_INPUT" = "y" ] || [ "$RATE_LIMIT_INPUT" = "Y" ] && echo "true" || echo "false")
fi

# =============================================================================
# Step 5: Database Configuration
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    echo ""
    print_header "Step 5: Database Configuration"
    echo ""
fi

if [ -z "$DB_NAME" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        DB_NAME="${SERVICE_PREFIX}_db"
    else
        read -p "Database name [${SERVICE_PREFIX}_db]: " DB_NAME
        DB_NAME=${DB_NAME:-${SERVICE_PREFIX}_db}
    fi
fi

if [ -z "$DB_USER" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        DB_USER="app_user"
    else
        read -p "Database user [app_user]: " DB_USER
        DB_USER=${DB_USER:-app_user}
    fi
fi

if [ -z "$GEN_PASS_INPUT" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        GEN_PASS_INPUT="y"
    else
        read -p "Generate secure database password? [Y/n]: " GEN_PASS_INPUT
    fi
fi

if [ -z "$DB_PASSWORD" ]; then
    if [ "$GEN_PASS_INPUT" = "n" ] || [ "$GEN_PASS_INPUT" = "N" ]; then
        if [ "$NON_INTERACTIVE" = true ]; then
            print_error "Manual password entry not supported in non-interactive mode. Set generate_password=true in config."
            exit 1
        fi
        read -sp "Database password: " DB_PASSWORD
        echo ""
    else
        DB_PASSWORD=$(openssl rand -base64 32)
        [ "$DRY_RUN" = false ] && print_step "Generated secure database password"
    fi
fi

# =============================================================================
# Step 6: Deployment Configuration
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    echo ""
    print_header "Step 6: Deployment Mode"
    echo ""
fi

if [ -z "$DEPLOY_MODE" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        DEPLOY_MODE=2  # Default to standalone
    else
        echo "Select deployment strategy:"
        echo "  [1] Fleet Mode (Traefik + TLS + Tailscale)"
        echo "  [2] Standalone Mode (direct localhost ports)"
        echo "  [3] Hybrid (Fleet for prod, Standalone for dev)"
        echo ""
        read -p "Select [1-3]: " DEPLOY_MODE
    fi
fi

case $DEPLOY_MODE in
    1)
        DEPLOY_MODE_NAME="fleet"
        if [ -z "$TRAEFIK_HOST" ]; then
            if [ "$NON_INTERACTIVE" = true ]; then
                print_error "TRAEFIK_HOST required for fleet mode in config"
                exit 1
            fi
            read -p "Tailscale hostname (e.g., $SERVICE_PREFIX.piranha-broadnose.ts.net): " TRAEFIK_HOST
        fi
        [ "$DRY_RUN" = false ] && print_step "Deployment: Fleet (Traefik + TLS)"
        ;;
    2)
        DEPLOY_MODE_NAME="standalone"
        [ "$DRY_RUN" = false ] && print_step "Deployment: Standalone (localhost)"
        ;;
    3)
        DEPLOY_MODE_NAME="hybrid"
        if [ -z "$TRAEFIK_HOST" ]; then
            if [ "$NON_INTERACTIVE" = true ]; then
                print_error "TRAEFIK_HOST required for hybrid mode in config"
                exit 1
            fi
            read -p "Tailscale hostname for production: " TRAEFIK_HOST
        fi
        [ "$DRY_RUN" = false ] && print_step "Deployment: Hybrid"
        ;;
    *)
        print_error "Invalid deployment selection. Must be 1, 2, or 3."
        exit 1
        ;;
esac

# =============================================================================
# Step 7: Monitoring Configuration
# =============================================================================
if [ "$DRY_RUN" = false ]; then
    echo ""
    print_header "Step 7: Monitoring & Observability"
    echo ""
fi

if [ -z "$METRICS_INPUT" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        METRICS_INPUT="y"
    else
        read -p "Enable Prometheus metrics? [Y/n]: " METRICS_INPUT
    fi
fi

if [ -z "$ENABLE_METRICS" ]; then
    ENABLE_METRICS=$([ "$METRICS_INPUT" = "n" ] || [ "$METRICS_INPUT" = "N" ] && echo "false" || echo "true")
fi

if [ -z "$TRACING_INPUT" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        TRACING_INPUT="n"
    else
        read -p "Enable distributed tracing? [y/N]: " TRACING_INPUT
    fi
fi

if [ -z "$ENABLE_TRACING" ]; then
    ENABLE_TRACING=$([ "$TRACING_INPUT" = "y" ] || [ "$TRACING_INPUT" = "Y" ] && echo "true" || echo "false")
fi

if [ "$ENABLE_TRACING" = "true" ] && [ -z "$TRACING_ENDPOINT" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        print_error "TRACING_ENDPOINT required when tracing is enabled in config"
        exit 1
    fi
    read -p "Jaeger/Zipkin endpoint: " TRACING_ENDPOINT
fi

# =============================================================================
# Dry Run Summary
# =============================================================================
if [ "$DRY_RUN" = true ]; then
    echo ""
    print_header "🔍 Dry Run Summary"
    echo ""
    echo "The following would be created:"
    echo ""
    echo "Project Directory: ../$PROJECT_NAME/"
    echo ""
    echo "Boilerplates to copy:"
    [ "$BACKEND_STACK" = "java" ] || [ "$BACKEND_STACK" = "both" ] && echo "  ✓ Java (Spring Boot)"
    [ "$BACKEND_STACK" = "python" ] || [ "$BACKEND_STACK" = "both" ] && echo "  ✓ Python (FastAPI)"
    [ "$FRONTEND_STACK" = "reactjs" ] && echo "  ✓ ReactJS"
    [ "$FRONTEND_STACK" = "quasar" ] && echo "  ✓ Quasar"
    [ "$FRONTEND_STACK" = "none" ] && echo "  ✓ None (API only)"
    echo ""
    echo "Core files:"
    echo "  ✓ docker-compose.yml"
    echo "  ✓ docker-compose.standalone.yml"
    echo "  ✓ docker-compose.traefik.yml"
    echo "  ✓ README.md"
    echo "  ✓ docs/ (all documentation)"
    echo "  ✓ scripts/ (including this wizard)"
    echo ""
    echo "Configuration:"
    echo "  • Project: $PROJECT_NAME"
    echo "  • Service prefix: $SERVICE_PREFIX"
    echo "  • Backend: $BACKEND_STACK"
    echo "  • Frontend: $FRONTEND_STACK"
    echo "  • MFA: $ENABLE_MFA ($MFA_METHODS)"
    echo "  • JWT expiry: $JWT_EXPIRY minutes"
    echo "  • Rate limiting: $ENABLE_RATE_LIMIT"
    echo "  • Database: $DB_NAME (user: $DB_USER)"
    echo "  • Deployment: $DEPLOY_MODE_NAME"
    [ -n "$TRAEFIK_HOST" ] && echo "  • Traefik host: $TRAEFIK_HOST"
    echo "  • Metrics: $ENABLE_METRICS"
    echo "  • Tracing: $ENABLE_TRACING"
    echo ""
    echo "Actions:"
    echo "  ✓ Create directory: ../$PROJECT_NAME/"
    echo "  ✓ Copy selected boilerplates"
    echo "  ✓ Generate .env file with secure passwords"
    echo "  ✓ Rename services in docker-compose files"
    echo "  ✓ Create project_setup.md"
    echo "  ✓ Initialize Git repository"
    echo ""
    if [ -n "$SAVE_CONFIG_FILE" ]; then
        echo "  ✓ Save configuration to: $SAVE_CONFIG_FILE"
    fi
    echo ""
    print_info "This was a dry run. No files were created."
    print_info "Run without --dry-run to create the project."
    exit 0
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
    if [ "$NON_INTERACTIVE" = true ]; then
        print_error "Use --yes with caution - would overwrite existing directory"
        exit 1
    fi
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
cat > "$PROJECT_DIR/project_setup.md" <<EOF
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

print_step "Created: project_setup.md"

# Save configuration if requested
if [ -n "$SAVE_CONFIG_FILE" ]; then
    echo ""
    print_info "Saving configuration to: $SAVE_CONFIG_FILE"
    
    cat > "$SAVE_CONFIG_FILE" <<EOF
{
  "project_name": "$PROJECT_NAME",
  "service_prefix": "$SERVICE_PREFIX",
  "repo_url": "$REPO_URL",
  "backend_stack": "$BACKEND_STACK",
  "frontend_stack": "$FRONTEND_STACK",
  "enable_mfa": $ENABLE_MFA,
  "mfa_methods": "$MFA_METHODS",
  "jwt_expiry": $JWT_EXPIRY,
  "enable_rate_limit": $ENABLE_RATE_LIMIT,
  "db_name": "$DB_NAME",
  "db_user": "$DB_USER",
  "generate_password": true,
  "deploy_mode": "$DEPLOY_MODE_NAME",
  "traefik_host": "$TRAEFIK_HOST",
  "enable_metrics": $ENABLE_METRICS,
  "enable_tracing": $ENABLE_TRACING
}
EOF
    
    print_step "Configuration saved"
fi

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
echo "  4. Open project_setup.md for detailed instructions"
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

exit 0
