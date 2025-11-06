# Skills Development Guide for omni-ai

**Purpose**: Step-by-step guide for creating high-quality skills that extend omni-ai's capabilities.

---

## Quick Start: Creating Your First Skill (30 minutes)

### Step 1: Plan Your Skill (5 min)

Answer these questions:

1. **What problem does it solve?**
   - "DataDog investigations currently need 5 iterations"
   - "We want that to be 2 iterations"

2. **What's the skill name?** (kebab-case, verb-focused)
   - ✅ `datadog-api-navigator`
   - ✅ `api-correlation-patterns`
   - ❌ `DataDog_API`

3. **What's the trigger description?** (Include keywords users will mention)
   ```
   "Expert guide for DataDog investigations. Use when investigating errors,
   latency, availability, or infrastructure issues in DataDog."
   ```

4. **What's the core knowledge needed?**
   - Investigation framework (5 phases)
   - API patterns and query examples
   - Error recovery strategies
   - Real examples

### Step 2: Create Directory Structure (2 min)

```bash
mkdir -p .claude/skills/skill-name/examples
touch .claude/skills/skill-name/SKILL.md
```

### Step 3: Write SKILL.md (15 min)

Use this minimal template:

```markdown
---
name: skill-name
description: |
  ONE-LINE SUMMARY.

  TRIGGER TERMS: Include keywords like "error investigation", "DataDog", etc.

  SCOPE: What's included and what's not.
---

# Skill Name

## When to Use This Skill

Describe positive cases:
- ✅ Use when investigating production errors
- ✅ Use when analyzing error trends
- ❌ Don't use for non-DataDog problems

## Core Framework

Explain the main methodology (3-5 steps).

## Key Patterns

Provide 2-3 concrete patterns with examples.

## Common Errors & Recovery

What can go wrong and how to fix it.

## Examples

Show 1-2 real scenarios.
```

### Step 4: Test Discovery (3 min)

1. Open Claude Code
2. In chat, ask: "What skills do I have available?"
3. Your skill should appear
4. Ask a question matching the skill description
5. Claude should reference the skill

### Step 5: Iterate Based on Results (5 min)

If Claude doesn't use your skill:
- Check description has clear trigger terms
- Make description more specific
- Add examples that match common queries

---

## Detailed Best Practices

### Best Practice 1: Progressive Disclosure

**Problem**: If you put everything in SKILL.md, it bloats the context.

**Solution**: Use supporting files strategically.

**Example - DataDog Skill**:

SKILL.md (~400 lines): Core framework + quick reference
```markdown
# DataDog API Navigator

## Quick Query Templates

Error investigation:
```sql
sum:trace.web.request.errors{service:$SERVICE} by {error.type}
```

See `query-patterns.md` for 20+ more patterns.
```

query-patterns.md (~400 lines): Complete pattern library
```markdown
# Query Patterns

## Error Investigation Template

Error rate over time:
```sql
sum:trace.web.request.errors{service:$SERVICE}
```

[... 20 more patterns ...]
```

**Result**:
- SKILL.md is loaded immediately (~400 tokens)
- query-patterns.md is loaded only if Claude needs it (~0 baseline)
- Claude can reference patterns without loading full file

### Best Practice 2: Descriptive Trigger Terms

**Bad Description** (too generic):
```yaml
description: "Helps with DataDog API queries"
```

Claude won't know when to use this.

**Good Description** (specific and complete):
```yaml
description: |
  Expert guide for DataDog investigations. Provides query syntax,
  investigation playbooks, and error recovery. Use when investigating
  errors, latency, availability, or infrastructure issues using DataDog.
```

Claude recognizes trigger terms: "errors", "latency", "DataDog", etc.

**Trigger Terms Checklist**:
- [ ] Problem types (errors, latency, availability, etc.)
- [ ] Platform/service names (DataDog, AWS, etc.)
- [ ] Investigation actions (investigate, analyze, debug, etc.)
- [ ] Negative cases ("don't use for...")

### Best Practice 3: Assume Competence

**Bad** (wastes tokens explaining basics):
```markdown
## What is DataDog?

DataDog is a monitoring platform founded in 2010 that provides...
[200 words of background]
```

Claude already knows this.

**Good** (focus on domain specifics):
```markdown
## DataDog Query Syntax

The `sum:` aggregator calculates total metric value.
For error rates, use: `sum:trace.web.request.errors{service:$SERVICE}`

Common aggregators:
- `sum:` - Total
- `avg:` - Average
- `max:` - Maximum
```

**Guideline**: Each sentence should teach something Claude doesn't already know.

### Best Practice 4: Real Examples

**Bad** (fictional):
```markdown
## Example

If you have errors, query: sum:errors{service:payment}
This returns the error count.
```

**Good** (realistic):
```markdown
## Example: Payment Service Error Spike (Nov 5, 2:45 PM)

Query:
```
sum:trace.web.request.errors{service:payment-service}
  by {error.type, error.status_code}
```

Result:
- 1,247 errors over 15 minutes
- 85% are 503 errors (service unavailable)
- 15% are 504 errors (timeout)

Investigation follow-up:
1. Check infrastructure metrics (CPU, memory)
2. Check recent deployments (payment-service v2.3 deployed 2:40 PM)
3. Query traces for v2.3 requests to see failure details

Resolution: Payment validation logic timing out after v2.3. Revert deployment.
```

This shows Claude how to actually use the skill.

### Best Practice 5: Document Decision Points

**Bad** (procedure only):
```markdown
## Investigation Steps

1. Query error rate
2. Query latency
3. Query infrastructure metrics
4. Done
```

**Good** (decision tree):
```markdown
## Investigation Decision Tree

Start: Do you see errors in DataDog?

IF yes:
  → Query error type distribution
  → Is 90%+ single error type?
    → YES: Focus on that error (see error-handling.md)
    → NO: Multiple issues (correlate with deployments)

IF no errors but high latency:
  → Query p95 latency trends
  → Query resource utilization
  → Correlate with deployments
```

This helps Claude make intelligent decisions.

### Best Practice 6: Version & Date Your Skill

```yaml
---
name: datadog-api-navigator
version: "1.0.0"
updated: "2025-11-06"
description: ...
---

# DataDog API Navigator

## Changelog

### v1.0.0 (2025-11-06)
- Initial release with error, latency, availability investigations
- Added 15 query pattern templates
- Added error recovery guide

### v1.1.0 (planned)
- Add APM trace analysis
- Add database performance metrics
```

This helps with maintenance and shows skill is actively managed.

---

## Creating Different Skill Types

### Type 1: Investigation Skills (Most Common)

**Example**: `datadog-api-navigator`, `api-correlation-patterns`

**Structure**:
1. Framework (step-by-step methodology)
2. Patterns (query templates, workflows)
3. Examples (real scenarios)
4. Error recovery (what to do when stuck)

**File layout**:
```
skill-name/
├── SKILL.md (framework + quick reference)
├── patterns.md (detailed patterns)
├── examples/
│   ├── scenario-1.md
│   └── scenario-2.md
└── error-recovery.md
```

### Type 2: Decision-Making Skills

**Example**: `omni-investigation-framework`

**Structure**:
1. Decision trees (when to use what)
2. Methodology (step-by-step)
3. Examples (real scenarios)
4. Anti-patterns (what NOT to do)

**File layout**:
```
skill-name/
├── SKILL.md (core decision trees)
├── decision-trees.md (detailed decision logic)
└── examples/
    ├── correct-approach.md
    └── incorrect-approach.md
```

### Type 3: Reference Skills

**Example**: `error-catalog`, `datadog-endpoints`

**Structure**:
1. Taxonomy (how things are organized)
2. Reference entries (detailed info per item)
3. Index (how to find things)
4. Examples (using the reference)

**File layout**:
```
skill-name/
├── SKILL.md (intro + index)
├── reference.md (all entries)
└── examples/
    └── how-to-use.md
```

---

## Testing Your Skill

### Test 1: Discovery

```
You: "What skills do you have available?"
Claude: "I have the following skills... [lists your skill]"
```

If your skill doesn't appear:
- Check YAML syntax in SKILL.md
- Ensure `---` delimiters are correct
- Check skill name is present
- Wait a moment for SDK to reload

### Test 2: Activation

```
You: "I need to investigate a DataDog error spike"
Claude: "I can help using the DataDog API Navigator skill..."
```

If Claude doesn't mention the skill:
- Check description has clear trigger terms
- Make description more specific
- Try explicitly mentioning skill terms

### Test 3: Utility

```
You: [Ask a question the skill should help with]
Claude: [References specific patterns/frameworks from skill]
```

If Claude doesn't use skill knowledge:
- Add more concrete examples
- Make patterns more specific
- Simplify framework explanation

### Test 4: Performance

**Before skill**: Investigation takes 5 iterations
**After skill**: Investigation takes 2 iterations

If no improvement:
- Skill patterns might not match actual queries agent makes
- Collect actual queries agent used
- Update skill patterns based on real usage
- Re-test

### Testing Checklist

- [ ] Skill appears when you ask for available skills
- [ ] Skill activates for relevant questions
- [ ] Claude references skill knowledge in responses
- [ ] Examples in skill are realistic
- [ ] Investigation iterations reduced by 30%+
- [ ] No errors in SKILL.md YAML
- [ ] All file paths use forward slashes
- [ ] No Windows-specific paths (`\` instead of `/`)
- [ ] Tested with Haiku, Sonnet, and Opus models
- [ ] Teammate can discover and use skill without help

---

## Common Pitfalls & How to Avoid Them

### Pitfall 1: Generic Description

❌ **Bad**: "Helps with DataDog investigations"
✅ **Good**: "Expert guide for DataDog investigations. Use when investigating errors, latency, availability, or infrastructure issues."

**Why**: Specific descriptions with trigger terms help Claude discover when to use the skill.

### Pitfall 2: Bloated SKILL.md

❌ **Bad**: 2000+ lines in SKILL.md
✅ **Good**: 400-600 lines in SKILL.md + references to supporting files

**Why**: Context is shared; progressively load detailed content.

### Pitfall 3: Unclear Examples

❌ **Bad**: "Query error rate: sum:errors{service:X}"
✅ **Good**: "Query error rate over 1 hour: sum:trace.web.request.errors{service:payment-service} [1h]"

**Why**: Realistic examples show actual usage.

### Pitfall 4: Windows-Style Paths

❌ **Bad**: `See reference\guide.md`
✅ **Good**: `See reference/guide.md`

**Why**: Unix-style forward slashes work everywhere.

### Pitfall 5: Duplicating Agent Knowledge

❌ **Bad**: Skill explains what an error is
✅ **Good**: Skill explains how to diagnose errors in DataDog

**Why**: Don't waste tokens on things Claude already knows.

### Pitfall 6: Skill Never Updates

❌ **Bad**: Create skill once, never maintain it
✅ **Good**: Quarterly review + version updates

**Why**: APIs change; skills become stale fast.

---

## Skill Evolution: From Initial to Mature

### Stage 1: Initial (Weeks 1-2)

- Basic framework documented
- 2-3 examples included
- Minimal supporting files
- Lines: 300-400

**Focus**: Get something working fast.

### Stage 2: Operational (Weeks 3-4)

- More detailed patterns
- Error recovery documented
- 5-10 examples
- Supporting files for reference
- Lines: 600-800

**Focus**: Make the skill genuinely useful.

### Stage 3: Optimized (Weeks 5-6)

- Performance metrics tracked
- Skill refined based on real usage
- Decision trees added
- Anti-patterns documented
- Advanced patterns for edge cases
- Lines: 800-1200 (spread across multiple files)

**Focus**: Make the skill expert-level.

### Stage 4: Mature (Ongoing)

- Quarterly reviews
- User feedback integrated
- Version management established
- Clear deprecation path if needed
- Companion skills integrated
- Lines: Stable, versioned

**Focus**: Maintain and extend.

---

## Integrating Skills Into Agents

### The Good News: No Agent Changes Needed

Skills are automatically discovered and available to Claude. No code changes required.

### Optional: Hint in Agent Prompts (Advanced)

If you want to ensure an agent uses a particular skill, you can mention it in the agent prompt:

```typescript
// agents/datadog-champion.ts

const systemPrompt = `You are the DataDog Champion agent.

When investigating DataDog issues, use the "datadog-api-navigator" skill for guidance
on query syntax, investigation patterns, and error recovery.

${subAgentConfigs['datadog-champion'].prompt}
`;
```

But this is **optional** - Claude will discover relevant skills automatically.

---

## Maintaining & Evolving Skills

### Quarterly Maintenance Checklist

Every 3 months:

- [ ] Review skill usage logs
- [ ] Collect agent feedback
- [ ] Identify new patterns from actual investigations
- [ ] Update examples with recent scenarios
- [ ] Check if any patterns are outdated
- [ ] Verify error recovery procedures still work
- [ ] Test with latest Claude models
- [ ] Update version number if changes made
- [ ] Create changelog entry

### When to Deprecate a Skill

A skill is a candidate for deprecation if:
- No investigations used it in past 3 months
- Better skill exists that covers same domain
- API/service it documents no longer exists
- Patterns are consistently wrong

**Deprecation process**:
1. Create replacement skill (or enhance existing one)
2. Mark old skill as deprecated in SKILL.md
3. Point users to replacement
4. Leave skill available for 1 month
5. Archive or remove

### When to Split a Skill

If a skill becomes >1500 lines, consider splitting:

**Example: DataDog Navigator**
- Too large? Split into:
  - `datadog-error-investigation` (just errors)
  - `datadog-latency-investigation` (just latency)
  - `datadog-infrastructure-monitoring` (infrastructure)

Each focused skill is more discoverable and maintainable.

### When to Merge Skills

If two skills overlap significantly:

**Example**:
- `query-optimization` focuses on DataDog
- `api-optimization` is generic
- Merge into `query-optimization-guide` covering both?

Only if they share enough patterns to justify single skill.

---

## Advanced: Custom Tool Restrictions

For sensitive or specialized skills, limit Claude's tools:

```yaml
---
name: read-only-audit-skill
allowed-tools: Read, Glob, Grep
description: "Read-only audit analysis"
---

# Read-Only Audit Skill

This skill uses only read-only tools to prevent accidental modifications.
```

**Common restrictions**:
- Read-only: `Read, Glob, Grep`
- Data analysis: `Read, Glob, Grep, Bash`
- Full access: (default, no restrictions)

For omni-ai, use full access (all skills need MCP tools).

---

## FAQ: Skills Development

**Q: How long should a SKILL.md be?**
A: 400-600 lines is ideal. More than 1000 lines? Move detailed content to supporting files.

**Q: Can a skill have sub-skills?**
A: No, but one skill can mention others: "See `datadog-api-navigator` for API syntax details."

**Q: How many skills should omni-ai have?**
A: Target: 8-12 at maturity. Each covers one investigation domain.

**Q: What if an agent needs multiple skills?**
A: Perfect! Skills are composable. Agent reads all relevant skills for a query.

**Q: Can skills call tools directly?**
A: No, only Claude can call tools. Skills provide guidance; Claude executes.

**Q: Should skills have YAML config?**
A: Only if necessary for discovery/metadata. Keep to minimal frontmatter.

**Q: How do I know if a skill is effective?**
A: Measure: Are investigations faster? Are errors fewer? Are iterations down?

---

## Your Skill Development Workflow

1. **Plan** (30 min) - What problem, what's the skill name, what triggers it?
2. **Create** (1-2 hours) - Write SKILL.md following template
3. **Test** (30 min) - Discovery, activation, utility tests
4. **Iterate** (1 hour) - Refine based on test results
5. **Validate** (1-2 hours) - Use with agents, measure improvements
6. **Maintain** (quarterly) - Review and evolve

**Total initial effort**: 4-5 hours per skill
**Maintenance effort**: 1-2 hours per quarter

---

## Next Steps

1. Read `SKILLS_ARCHITECTURE.md` for the big picture
2. Create first skill using this guide
3. Test with Claude Code
4. Validate with omni-ai agents
5. Document lessons learned
6. Create next skill based on experience

---

**Questions?** See `SKILLS_ARCHITECTURE.md` for strategic context, or reach out to the team.

Good luck creating great skills! 🚀
