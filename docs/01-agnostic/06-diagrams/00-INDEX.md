# Diagram Index

**Purpose**: Central catalog of all architecture diagrams with rendered previews and usage guidance.

**Last Updated**: 2026-05-25  
**Total Diagrams**: 8 PlantUML diagrams

---

## 📐 Diagram Catalog

### 1. Clean Architecture
**File**: [`01-clean-architecture.puml`](01-clean-architecture.puml)  
**Purpose**: Shows Clean Architecture layers and dependencies  
**When to Use**: 
- Onboarding new developers
- Architecture review meetings
- PR descriptions for structural changes

**Key Concepts**:
- Domain → Application → Infrastructure → Presentation
- Dependency rule (inward-pointing dependencies)
- Ports and adapters pattern

---

### 2. Domain-Driven Design Aggregate
**File**: [`02-ddd-aggregate.puml`](02-ddd-aggregate.puml)  
**Purpose**: DDD aggregate structure and relationships  
**When to Use**:
- Designing new domain models
- Refactoring existing aggregates
- Explaining aggregate boundaries

**Key Concepts**:
- Aggregate root
- Value objects
- Entity relationships
- Invariants

---

### 3. Microservices Architecture
**File**: [`03-microservices.puml`](03-microservices.puml)  
**Purpose**: System-level microservices topology  
**When to Use**:
- Infrastructure planning
- Service decomposition discussions
- Deployment architecture reviews

**Key Concepts**:
- Service boundaries
- Inter-service communication
- API gateway
- Database per service

---

### 4. Outbox Pattern
**File**: [`04-outbox-pattern.puml`](04-outbox-pattern.puml)  
**Purpose**: Event publishing with transactional outbox  
**When to Use**:
- Implementing event-driven architecture
- Ensuring atomic writes + event publishing
- Message queue integration

**Key Concepts**:
- Transactional outbox table
- Event publisher
- Message broker
- Exactly-once delivery

---

### 5. Ports & Adapters
**File**: [`05-port-adapter.puml`](05-port-adapter.puml)  
**Purpose**: Hexagonal architecture implementation  
**When to Use**:
- Explaining adapter patterns
- Adding new external integrations
- Refactoring legacy code

**Key Concepts**:
- Driving adapters (REST, GraphQL)
- Driven adapters (Database, External APIs)
- Ports (interfaces)
- Application core

---

### 6. Event-Driven Architecture
**File**: [`06-event-driven.puml`](06-event-driven.puml)  
**Purpose**: Event flow and domain events  
**When to Use**:
- Designing event handlers
- Explaining event sourcing
- Debugging event flows

**Key Concepts**:
- Domain events
- Event handlers
- Event bus
- Eventual consistency

---

### 7. Frontend Architecture
**File**: [`07-frontend-architecture.puml`](07-frontend-architecture.puml)  
**Purpose**: Frontend component hierarchy and state management  
**When to Use**:
- Frontend onboarding
- Component design reviews
- State management decisions

**Key Concepts**:
- Component layers (pages, components, hooks)
- State management (Zustand/Pinia)
- API integration
- Feature-sliced design

---

### 8. System Overview
**File**: [`08-system-overview.puml`](08-system-overview.puml)  
**Purpose**: High-level system context diagram  
**When to Use**:
- Stakeholder presentations
- New team member onboarding
- Architecture decision records

**Key Concepts**:
- System boundaries
- External systems
- User roles
- Data flow

---

## 🎨 Rendering Diagrams

### Option 1: PlantUML Server (Recommended)
```bash
# Start local PlantUML server
docker run -d -p 8080:8080 plantuml/plantuml-server

# Open in browser: http://localhost:8080
# Paste .puml file content to render
```

### Option 2: VS Code Extension
1. Install "PlantUML" extension by jebbs
2. Open `.puml` file
3. Press `Alt+D` to preview

### Option 3: Command Line
```bash
# Install PlantUML
sudo apt install plantuml  # Linux
brew install plantuml      # macOS

# Render to PNG
plantuml -tpng docs/01-agnostic/06-diagrams/01-clean-architecture.puml
```

### Option 4: GitHub Actions (Auto-Render)
Diagrams are automatically rendered on commit via GitHub Actions workflow.
Rendered PNGs available in `docs/01-agnostic/06-diagrams/rendered/`

---

## 📊 Usage Guidelines

### When to Reference Diagrams

| Scenario | Recommended Diagrams |
|----------|---------------------|
| **New Developer Onboarding** | #1 (Clean Arch), #8 (System Overview) |
| **Domain Modeling** | #2 (DDD Aggregate) |
| **API Design** | #1 (Clean Arch), #5 (Ports & Adapters) |
| **Event Implementation** | #4 (Outbox), #6 (Event-Driven) |
| **Frontend Work** | #7 (Frontend Architecture) |
| **Infrastructure Planning** | #3 (Microservices) |

### Embedding in Documentation

**Markdown**:
```markdown
![Clean Architecture](rendered/01-clean-architecture.png)
```

**Notion/Obsidian**:
```markdown
![[01-clean-architecture.png]]
```

**GitHub README**:
```markdown
![Clean Architecture](docs/01-agnostic/06-diagrams/rendered/01-clean-architecture.png)
```

---

## 📁 File Locations

All diagrams stored in: `docs/01-agnostic/06-diagrams/`

- Source files: `*.puml`
- Rendered PNGs: `rendered/*.png`
- This index: `00-INDEX.md`

---

## 🔄 Maintenance

### Adding New Diagrams
1. Create `.puml` file in `docs/01-agnostic/06-diagrams/`
2. Add entry to this index with purpose and usage
3. Commit - GitHub Actions will auto-render PNG
4. Update related documentation to reference diagram

### Updating Existing Diagrams
1. Edit `.puml` file
2. Commit - GitHub Actions will auto-update PNG
3. Verify rendered output matches intent
4. Update this index if purpose/usage changed

### Deprecating Diagrams
1. Move `.puml` and `rendered/*.png` to `archive/` subdirectory
2. Mark entry in this index as "⚠️ Deprecated"
3. Update documentation references

---

## 🛠️ Tools & Extensions

### Recommended Tools
- **PlantUML Server**: Docker-based rendering
- **VS Code Extension**: Real-time preview
- **IntelliJ Plugin**: Built-in PlantUML support
- **Eclipse Plugin**: PlantUML plugin

### Integration
- **GitHub Actions**: Auto-render on commit
- **CI/CD**: Validate diagram syntax
- **Documentation Site**: Embed rendered PNGs

---

**Related Documentation**:
- Architecture Standards: `docs/01-agnostic/01-standards/02-architecture.md`
- ADRs: `docs/01-agnostic/02-adrs/`
- Getting Started: `docs/01-agnostic/00-getting-started.md`
