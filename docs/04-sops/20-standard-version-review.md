# SOP-20: Monthly Standard Version Review

## Purpose
Ensure consuming agents do not silently receive breaking changes when standards evolve.

## Frequency
Monthly, first Monday of the month, as part of architecture standup.

## Owner
Architecture team lead (rotating: @leonardsoetedjo)

## Procedure

1. **Check for standard changes**
   ```bash
   git diff HEAD~30 -- docs/01-agnostic/01-standards/27-*.md
   git diff HEAD~30 -- docs/01-agnostic/01-standards/28-*.md
   git diff HEAD~30 -- docs/01-agnostic/01-standards/29-*.md
   ```

2. **Review diff significance**
   - Patch (wording, examples): No action needed
   - Minor (new constraint, new section): Update `.agents.yml` minor version
   - Major (removed section, changed output schema): Breaking change

3. **If breaking change detected**
   a. Pause promotion to Active (keep Draft)
   b. Create migration guide in `docs/04-sops/`
   c. Update `.agents.yml` with version warning
   d. Notify all consuming agents via AGENTS.md changelog
   e. Schedule migration window (min 2 weeks)

4. **Record review**
   ```bash
   # Add entry to version log
   echo "$(date +%Y-%m-%d): Standard 27 reviewed, no changes" >> docs/decision-records/STANDARD_VERSION_LOG.md
   ```

## Emergency Procedure

If a breaking change is discovered outside the monthly review:
1. Revert commit to `main` immediately
2. Branch the breaking change to `standard/vNEXT`
3. Announce via GitHub issue + AGENTS.md banner
4. Proceed with migration guide (step 3 above)

## Version Format

`.agents.yml` field: `version: "MAJOR.MINOR"`

Standard frontmatter: `version: "MAJOR.MINOR"`

Match required: `.agents.yml` version ≥ standard version

## Decision Rationale

Owner chose Option C (monthly human review) over automated version pinning (Options A/B) because:
- Low churn: standards change <1x/month
- Human judgment catches semantic nuance machines miss
- Avoids CI complexity and .agents.yml maintenance burden
- Trade-off: relies on calendar discipline; mitigated by standup ritual
