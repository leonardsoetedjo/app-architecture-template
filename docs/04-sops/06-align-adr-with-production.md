---
name: "SOP: ADR Alignment — Document Production Adapters"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP: ADR Alignment — When Documented Adapters Differ From Production

## Trigger

An architecture audit discovers that a production adapter differs from the one documented in the project's ADR (e.g., ADR-04 documents `FinBertSentimentAdapter` but `dependencies.py` wires `LexiconSentimentAdapter`).

## The Rule

> **ADR contracts MUST describe what is currently running, not what is planned or aspirational.**

Two valid resolutions exist. The project MUST pick one and close the gap within one sprint.

## Resolution Options

### Option A: Update ADRs (Recommended for Placeholders)

Use when the production adapter is intentionally simpler than the ADR target (e.g., dictionary-based sentiment vs FinBERT, local RSS vs Bloomberg API).

1. Update the ADR to document the **current** adapter as the implemented solution
2. Add a **"Future State"** section describing the planned upgrade
3. Document the substitution rationale (e.g., "FinBERT requires GPU and model downloads; Lexicon adapter satisfies CI requirements and avoids cold-start latency")
4. Ensure the ADR's fallback guarantees are tested against the **actual** adapter

**Example**:

```markdown
## ADR-04: Sentiment Analysis

### Decision (Current)
We use `LexiconSentimentAdapter` — a curated finance-aware lexicon with negation handling.
It requires no model downloads, no GPU, and runs offline.

### Future State (Planned)
Replace with `FinBertSentimentAdapter` when:
- GPU inference endpoint is provisioned (see ticket FIN-203)
- Model warmup time < 500ms p95
- Fallback-to-neutral behavior is integration-tested for FinBERT

### Substitution Rationale
The lexicon adapter was chosen to eliminate cold-start latency in CI
and to avoid a dependency on Hugging Face model hosting during the MVP phase.
```

### Option B: Implement Documented Adapters

Use when the ADR describes the true production target and the current adapter is a shortcut.

1. Implement the documented adapter behind the same domain port
2. Swap the DI wiring in `dependencies.py`
3. Integration-test the new adapter with the port's fallback semantics
4. Document the swap reason in a new ADR or ADR amendment

**Example**:

```python
# src/infrastructure/dependencies.py
from .adapters.finbert_sentiment import FinBertSentimentAdapter

def get_sentiment_engine() -> SentimentEnginePort:
    return FinBertSentimentAdapter(model_path=os.getenv("FINBERT_MODEL_PATH"))
```

### Choosing Between A and B

| Factor | Choose Option A | Choose Option B |
|--------|-----------------|-----------------|
| Current adapter is production-intentional | ✅ | ❌ |
| Current adapter is a temporary shortcut | ❌ | ✅ |
| Upgrade requires infra not yet provisioned | ✅ | ❌ |
| Upgrade has unclear timeline | ✅ | ❌ |
| Current adapter lacks test coverage | ❌ | ✅ |
| Team has bandwidth to build + test upgrade | ❌ | ✅ |

## Testing Requirement

**Regardless of which option is chosen**, the adapter MUST satisfy the port's contract:

```python
# tests/integration/test_sentiment_fallback.py
@pytest.mark.asyncio
async def test_sentiment_adapter_neutral_on_failure():
    """Any SentimentEnginePort impl must return neutral score on failure."""
    adapter = get_sentiment_engine()  # whatever is wired today

    # Force a failure condition (bad input, network timeout, etc.)
    result = await adapter.score("")  # empty input
    assert result.label == "neutral"
    assert result.confidence <= Decimal("0.1")
```

## Audit Detection Pattern

Auditors detect this drift with:

```bash
# 1. Compare ADR docs to DI wiring
grep -h "Adapter\|adapter" docs/architecture/04-* docs/architecture/05-* | grep -oP '\w+Adapter'
grep -oP 'return \w+Adapter\(\)' src/infrastructure/dependencies.py
# Mismatches = drift

# 2. Check for unwired adapters
find src/infrastructure/adapters/ -name "*adapter.py" | while read f; do
    classname=$(grep -oP 'class \K\w+Adapter' "$f" | head -1)
    if ! grep -q "$classname" src/infrastructure/dependencies.py; then
        echo "UNWIRED: $classname in $f"
    fi
done
```

## Real-World Example

**stock-analyser MAJ-2 (2026-06-18)**:

| ADR | Documented | Wired | Status |
|-----|-----------|-------|--------|
| ADR-04 | `FinBertSentimentAdapter` | `LexiconSentimentAdapter` | Drift |
| ADR-05 | `EdgarAdapter` + `BloombergRssAdapter` | `YFinanceAdapter` + `NewsServiceAdapter` (Google RSS) | Drift |
| | `EdgarAdapter` exists at `src/infrastructure/adapters/edgar.py` | **Not wired** | Dead code |

Resolution: **Option A** — Lexicon adapter self-documents as placeholder. ADRs should be updated to reflect current state.

## Compliance Checklist

- [ ] Every adapter wired in `dependencies.py` is documented in an ADR
- [ ] Every adapter mentioned in an ADR is either wired OR explicitly marked as "future state"
- [ ] Unwired adapter files are either (a) wired, (b) documented as future, or (c) removed
- [ ] Integration tests verify fallback behavior for every wired adapter

## Related

- stock-analyser audit MAJ-2: `docs/architecture/AUDIT-2026-06-18.md`
- Standard 21 (Validation Harness): `docs/01-agnostic/01-standards/21-validation-harness.md`
