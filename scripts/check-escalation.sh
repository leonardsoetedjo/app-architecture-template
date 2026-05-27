#!/usr/bin/env bash
# Check escalation levels for architecture violations
# Triggers alerts when thresholds are exceeded
# Usage: ./scripts/check-escalation.sh

set -e

VIOLATION_LOG=".github/architecture-violations.log"

if [ ! -f "$VIOLATION_LOG" ]; then
  echo "✅ No violation log found - no escalations"
  exit 0
fi

echo "🔍 Checking escalation levels..."
echo ""

# Get current month
CURRENT_MONTH=$(date +%Y-%m)

# Count violations this month
MONTHLY_COUNT=$(grep -c "$CURRENT_MONTH" "$VIOLATION_LOG" 2>/dev/null || echo "0")

# Count violations this week (last 7 days)
WEEK_AGO=$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "")
if [ -n "$WEEK_AGO" ]; then
  WEEKLY_COUNT=$(awk -F',' -v week="$WEEK_AGO" 'NR>1 && $1 >= week {count++} END {print count+0}' "$VIOLATION_LOG" 2>/dev/null || echo "0")
else
  WEEKLY_COUNT=$MONTHLY_COUNT
fi

# Get unique users with violations this week
USERS_WITH_VIOLATIONS=$(awk -F',' -v week="$WEEK_AGO" 'NR>1 && $1 >= week {print $3}' "$VIOLATION_LOG" 2>/dev/null | sort -u | wc -l || echo "0")

# Escalation levels
echo "📊 Violation Counts:"
echo "  This week: $WEEKLY_COUNT"
echo "  This month: $MONTHLY_COUNT"
echo "  Users affected: $USERS_WITH_VIOLATIONS"
echo ""

ESCALATION_LEVEL=0
ESCALATION_MESSAGE=""

# Level 1: 1st violation
if [ "$WEEKLY_COUNT" -ge 1 ] && [ "$WEEKLY_COUNT" -lt 2 ]; then
  ESCALATION_LEVEL=1
  ESCALATION_MESSAGE="First violation this week - warning issued"
fi

# Level 2: 2nd violation (same week)
if [ "$WEEKLY_COUNT" -ge 2 ] && [ "$WEEKLY_COUNT" -lt 3 ]; then
  ESCALATION_LEVEL=2
  ESCALATION_MESSAGE="Second violation this week - PR merge blocked until fix"
fi

# Level 3: 3rd violation (same week)
if [ "$WEEKLY_COUNT" -ge 3 ] && [ "$WEEKLY_COUNT" -lt 5 ]; then
  ESCALATION_LEVEL=3
  ESCALATION_MESSAGE="Third violation this week - architecture team notified"
fi

# Level 4: 5+ violations (same week)
if [ "$WEEKLY_COUNT" -ge 5 ] && [ "$WEEKLY_COUNT" -lt 10 ]; then
  ESCALATION_LEVEL=4
  ESCALATION_MESSAGE="CRITICAL: 5+ violations this week - ALL PRs require architecture review"
fi

# Level 5: 10+ violations (same week)
if [ "$WEEKLY_COUNT" -ge 10 ]; then
  ESCALATION_LEVEL=5
  ESCALATION_MESSAGE="EMERGENCY: 10+ violations this week - merge freeze, emergency review required"
fi

if [ "$ESCALATION_LEVEL" -gt 0 ]; then
  echo "🚨 ESCALATION LEVEL $ESCALATION_LEVEL DETECTED"
  echo "   $ESCALATION_MESSAGE"
  echo ""
  
  # Auto-create GitHub issue for high escalations
  if [ "$ESCALATION_LEVEL" -ge 3 ]; then
    echo "📝 Creating escalation issue..."
    
    ISSUE_TITLE="🚨 Architecture Escalation Level $ESCALATION_LEVEL: $WEEKLY_COUNT violations this week"
    ISSUE_BODY="## Critical: High violation rate detected

**Escalation Level:** $ESCALATION_LEVEL
**Violations this week:** $WEEKLY_COUNT
**Threshold:** $(echo $ESCALATION_LEVEL | awk '{if($1==3) print 3; else if($1==4) print 5; else if($1==5) print 10}')
**Users affected:** $USERS_WITH_VIOLATIONS

### Action Required

$(if [ $ESCALATION_LEVEL -ge 4 ]; then
  echo "- [ ] **IMMEDIATE:** Review all open PRs for architecture violations"
  echo "- [ ] **IMMEDIATE:** Block merges until review complete"
fi)

- [ ] Review violation log: \`.github/architecture-violations.log\`
- [ ] Identify root causes
- [ ] Meet with team to address patterns
- [ ] Update guardrails if needed
- [ ] Close this issue when resolved

### Recent Violations

\`\`\`
$(tail -10 "$VIOLATION_LOG" 2>/dev/null || echo "See .github/architecture-violations.log")
\`\`\`

---
*Auto-created by architecture escalation checker*
"
    
    # Check if escalation issue already exists
    EXISTING_ISSUE=$(gh issue list --state open --search "Architecture Escalation" --json number,title --limit 1 2>/dev/null || echo "")
    
    if [ -z "$EXISTING_ISSUE" ]; then
      gh issue create \
        --title "$ISSUE_TITLE" \
        --body "$ISSUE_BODY" \
        --label "architecture,escalation,critical" \
        --assignee "$(git config user.name 2>/dev/null || echo "")" \
        2>/dev/null || echo "   (Could not create issue - may need GitHub auth)"
      
      echo "   ✅ Escalation issue created"
    else
      echo "   ℹ️  Escalation issue already exists"
    fi
  fi
  
  exit $ESCALATION_LEVEL
else
  echo "✅ No escalation required"
  exit 0
fi
