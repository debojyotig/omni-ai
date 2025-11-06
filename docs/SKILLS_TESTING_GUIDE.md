# Skills Testing Guide for omni-ai

**Purpose**: Validate skills are effective and ready for production use.

---

## Testing Framework

### Testing Pyramid

```
         🎯 Real Investigation Testing (with actual agent)
        / \
       /   \
      /     \
     / Agent \
    / Tests   \
   /___________\
        |
    ______|______
   /            \
  / Discovery &   \
 / Activation    \
/________________\
        |
     ___|___
    /       \
   / YAML &   \
  / Syntax   \
 /___________\
```

Each level must pass before moving to next.

---

## Level 1: YAML & Syntax Validation

**Purpose**: Ensure SKILL.md is valid and can be loaded.

### Test 1.1: YAML Frontmatter

Check that frontmatter is valid:

```bash
# Create simple validation script
cat .claude/skills/skill-name/SKILL.md | head -20
```

Expected output:
```
---
name: skill-name
description: |
  Description here
---
```

**Check**:
- [ ] Starts with `---`
- [ ] Has `name:` field
- [ ] Has `description:` field
- [ ] Ends with `---` before content
- [ ] No tabs (spaces only)
- [ ] Proper indentation

### Test 1.2: Markdown Syntax

Validate content is valid Markdown:

```markdown
# Skill Name            <- Heading 1

## Section             <- Heading 2

Content with **bold** and `code`.

- Bullet point
```

**Check**:
- [ ] All headings are properly formatted
- [ ] Code blocks use triple backticks
- [ ] No unmatched brackets or parentheses
- [ ] Links are properly formatted: `[text](file.md)`
- [ ] File paths use forward slashes: `examples/file.md`

### Test 1.3: File References

Validate all referenced files exist:

```markdown
# Check all references in SKILL.md
See `patterns.md` for detailed patterns.
See `examples/scenario-1.md` for an example.
```

**Check**:
- [ ] `patterns.md` exists
- [ ] `examples/scenario-1.md` exists
- [ ] All paths use forward slashes, not backslashes
- [ ] All referenced files are in skill directory

---

## Level 2: Discovery & Activation Testing

**Purpose**: Ensure Claude discovers and uses the skill.

### Test 2.1: Skill Discovery in Claude Code

**Setup**: Open Claude Code chat

**Test**:
```
You: "What skills are available?"
```

**Expected Result**:
```
Claude: "You have the following skills available:
1. datadog-api-navigator - Expert guide for DataDog investigations...
2. [other skills...]
3. skill-name - [your skill description]..."
```

**Check**:
- [ ] Skill appears in list
- [ ] Description is truncated (first line shown)
- [ ] Skill name is correct (kebab-case)

### Test 2.2: Skill Activation

**Setup**: Claude Code chat, same session

**Test**: Ask a question that matches your skill description

```
You: "I need to investigate a DataDog error spike"
```

**Expected Result**:
```
Claude: "I can help you investigate this error spike. Let me use the
DataDog API Navigator skill to guide the investigation..."
```

**Or**:
```
Claude: "Based on the DataDog API Navigator skill, I know that error
investigations follow a 5-phase framework..."
```

**Check**:
- [ ] Claude mentions the skill by name
- [ ] Claude references specific knowledge from skill
- [ ] Claude explains reasoning using skill concepts

### Test 2.3: Skill Boundaries

Test that skill activates when it should, and NOT when it shouldn't.

**Positive Test**:
```
You: "How do I query errors in DataDog?" (if datadog-api-navigator skill)
Claude: [Uses skill knowledge]
```

**Negative Test**:
```
You: "What is Python?" (shouldn't use datadog skill)
Claude: [General answer without referencing skill]
```

**Check**:
- [ ] Skill activates for relevant queries
- [ ] Skill doesn't activate for unrelated queries
- [ ] Description trigger terms work as expected

---

## Level 3: Content Quality Testing

**Purpose**: Ensure skill content is accurate and helpful.

### Test 3.1: Accuracy Check

For each example in the skill:

```
Example from skill: "To query errors: sum:trace.web.request.errors{service:X}"

Test: Is this syntax correct according to DataDog docs?
Check: [ ] Yes, syntax is valid
       [ ] No, syntax is wrong - needs updating
```

**For each pattern**:
- [ ] Is the syntax correct?
- [ ] Do the parameters make sense?
- [ ] Would this query actually work?

### Test 3.2: Completeness Check

Run through the skill's main framework:

```
Skill says: "5-phase investigation framework"
1. Problem Scope
2. Data Collection
3. Pattern Analysis
4. Root Cause Determination
5. Impact Assessment

Test: Are these phases clearly explained?
[ ] Yes - each phase has 2-3 sentences
[ ] Incomplete - some phases missing detail
[ ] Unclear - phases not well explained
```

### Test 3.3: Example Realism Check

For each example in the skill:

```
Example: "Payment Service Error Spike Investigation"

Is this realistic?
[ ] Yes - mirrors actual investigations
[ ] Somewhat - simplified but recognizable
[ ] No - too fictional, doesn't reflect reality
```

**Check**:
- [ ] Examples use real service names (or realistic placeholders)
- [ ] Error patterns shown are actually possible
- [ ] Query results are realistic
- [ ] Investigation steps are how you'd actually investigate

### Test 3.4: Clarity Check

Read the skill as if you've never seen it. Ask:

- [ ] Is the investigation framework clear?
- [ ] Are query patterns easy to understand?
- [ ] Are error recovery steps obvious?
- [ ] Would a new team member understand how to use this?

If any answer is "no", the section needs rewriting.

---

## Level 4: Agent Integration Testing

**Purpose**: Verify skill actually helps agents investigate faster and better.

### Test 4.1: Basic Agent Test

**Setup**:
1. Start omni-ai: `npm run dev`
2. Create a new conversation

**Test**:
```
You: [Ask a question your skill should help with]
Example: "Investigate why payment-service has 50% error rate"

Expected: Agent uses skill knowledge to:
- Ask clarifying questions based on skill framework
- Propose specific queries from skill patterns
- Reference skill concepts when explaining approach
```

**Check**:
- [ ] Agent mentions skill concepts
- [ ] Agent asks informed questions (not generic ones)
- [ ] Agent proposes specific patterns (not trial-and-error)

### Test 4.2: Iteration Measurement

**Baseline Measurement (Without Skill)**:
1. Disable skill temporarily (rename directory)
2. Start new conversation
3. Ask investigation question
4. Count API calls until completion
5. Count "let me try another query" moments
6. Count time to root cause

```
Baseline Results:
- API calls: 8
- Query iterations: 4
- Time to root cause: 25 minutes
```

**With Skill**:
1. Re-enable skill
2. Start new conversation
3. Ask same investigation question
4. Count API calls
5. Count iterations
6. Count time

```
With Skill Results:
- API calls: 3
- Query iterations: 1
- Time to root cause: 5 minutes
```

**Calculate Improvement**:
- API reduction: (8-3)/8 = 62.5%
- Iteration reduction: (4-1)/4 = 75%
- Time reduction: (25-5)/25 = 80%

**Success Criteria**:
- [ ] API calls reduced by 30%+
- [ ] Iterations reduced by 30%+
- [ ] Time reduced by 30%+

### Test 4.3: Multiple Agent Testing

Test skill with different agents to ensure universal benefit:

```
Agent 1: DataDog Champion
- Test with error investigation query
- Measure improvement

Agent 2: API Correlator
- Test with correlation query
- Measure improvement

Agent 3: Smart Agent
- Test with open-ended query
- Measure improvement
```

**Success Criteria**:
- [ ] All agents benefit from skill
- [ ] Improvement consistent across agents
- [ ] No agent is hindered by skill

### Test 4.4: Error Path Testing

Test that skill helps with error recovery:

**Setup**: Trigger an error condition

```
You: "Investigate payment-service errors"
Agent: Makes a query that returns 429 (rate limited)

Expected: Agent reads error-recovery section of skill
  AND: Makes adjusted query with reduced scope
  AND: Gets results without retrying blindly
```

**Check**:
- [ ] Agent recognizes 429 error
- [ ] Agent reads skill error-handling section
- [ ] Agent adjusts query scope intelligently
- [ ] Agent doesn't spam same failed query

### Test 4.5: Model Size Testing

Test skill effectiveness across different model sizes:

```
Test with Claude Haiku (fast):
- [ ] Skill discovered
- [ ] Skill used appropriately
- [ ] Results are good

Test with Claude Sonnet (balanced):
- [ ] Skill discovered
- [ ] Skill used more thoroughly
- [ ] Results are very good

Test with Claude Opus (smart):
- [ ] Skill discovered
- [ ] Skill used deeply
- [ ] Results are excellent
```

---

## Level 5: Team Validation

**Purpose**: Ensure skill is useful to actual team members.

### Test 5.1: Independent Discovery

Give skill to teammate without explanation:

```
You: "There's a new skill in .claude/skills/. Can you figure out what it does?"

Expected: Teammate can:
- [ ] Discover skill using "what skills are available?"
- [ ] Understand what the skill does from description
- [ ] Use the skill without your explanation
- [ ] Find answers to their questions in the skill
```

### Test 5.2: Real Scenario Testing

Ask teammate to use skill for actual investigation:

```
You: "We have a production issue. Use the new skill to investigate."

Teammate uses skill + agent to investigate.

Check:
- [ ] Did skill help understand the problem?
- [ ] Did teammate find relevant patterns in skill?
- [ ] Did investigation complete faster than expected?
- [ ] Would teammate use this skill again?
```

### Test 5.3: Feedback Collection

Ask teammate for structured feedback:

```
1. On scale 1-10, how helpful was the skill? ___
2. Which sections were most useful? ___________
3. What was confusing? ___________
4. What's missing? ___________
5. Would you use this again? Yes / No / Maybe
```

**Success Criteria**:
- [ ] Average rating 7+/10
- [ ] Clear sections were useful
- [ ] Minimum confusion
- [ ] Would use again

---

## Testing Checklist

Before marking skill as "ready for production":

### YAML & Syntax
- [ ] Valid YAML frontmatter
- [ ] Valid Markdown syntax
- [ ] All referenced files exist
- [ ] No Windows-style paths

### Discovery & Activation
- [ ] Skill appears in "available skills" list
- [ ] Skill activates for relevant queries
- [ ] Skill doesn't activate for unrelated queries
- [ ] Description has clear trigger terms

### Content Quality
- [ ] Examples are accurate
- [ ] Framework is complete and clear
- [ ] Patterns are realistic
- [ ] Error recovery is documented
- [ ] New team member would understand

### Agent Integration
- [ ] Agent references skill knowledge
- [ ] API calls reduced by 30%+
- [ ] Iterations reduced by 30%+
- [ ] Error recovery works
- [ ] Works across multiple models

### Team Validation
- [ ] Teammate can independently discover skill
- [ ] Real investigation uses skill effectively
- [ ] Team feedback is positive (7+/10)
- [ ] Skill solves actual problem

---

## Performance Metrics Dashboard

Track these metrics for your skill:

```
Skill: datadog-api-navigator

Discovery Metrics:
- Skill appears in lists: Yes
- Activation rate (% of relevant queries): 85%
- Model compatibility: Haiku ✓ Sonnet ✓ Opus ✓

Performance Metrics:
- API calls reduced: 62.5%
- Iterations reduced: 75%
- Time to solution reduced: 80%

Quality Metrics:
- Accuracy of patterns: 100%
- Example realism: 90%
- Clarity score: 8.5/10

Team Feedback:
- Helpfulness rating: 8.2/10
- Would use again: 92%
- Feature requests: 3

Version: 1.0.0
Last tested: 2025-11-06
Status: Production Ready
```

---

## Regression Testing

When updating a skill, re-run these tests:

- [ ] YAML syntax still valid
- [ ] All file references still exist
- [ ] Discovery still works
- [ ] Performance metrics unchanged or improved
- [ ] Team doesn't report new confusion
- [ ] Examples still accurate

---

## Troubleshooting

### Problem: Skill not discovered

**Possible causes**:
1. YAML syntax error - Check with `head -20 SKILL.md`
2. Skill directory not in `.claude/skills/` - Verify path
3. Claude SDK not reloaded - Restart Claude Code
4. Description too generic - Add more trigger terms

**Solution**: Fix YAML, add trigger terms, restart.

### Problem: Skill activated but not used

**Possible causes**:
1. Content not clear enough
2. Examples too fictional
3. Framework too complex
4. Trigger terms don't match actual queries

**Solution**: Simplify content, make examples realistic, test with actual queries.

### Problem: Agent uses skill but doesn't improve

**Possible causes**:
1. Patterns in skill don't match agent's actual approach
2. Skill knowledge contradicts what agent learns from MCP
3. Examples are misleading
4. Framework doesn't match agent's decision process

**Solution**: Collect actual queries agent makes, update skill patterns based on reality.

### Problem: Team says skill is confusing

**Possible causes**:
1. Assumptions about prior knowledge wrong
2. Technical jargon not explained
3. Framework not clear
4. Too many options/patterns

**Solution**: Get specific feedback, simplify sections, test with new user.

---

## Continuous Testing

### Weekly
- [ ] Check skill is still discoverable
- [ ] Spot-check one investigation using skill
- [ ] Monitor for errors in agent logs

### Monthly
- [ ] Full iteration metric measurement
- [ ] Team feedback survey
- [ ] Review skill popularity metrics
- [ ] Check for API documentation changes

### Quarterly
- [ ] Full test suite (all levels)
- [ ] Update examples based on recent investigations
- [ ] Version bump and changelog
- [ ] Team retrospective on skill usefulness

---

## Success Criteria Summary

A skill is **ready for production** when:

1. ✅ All YAML & syntax is valid
2. ✅ Claude discovers it reliably
3. ✅ Content is accurate and clear
4. ✅ Agents use it to make better decisions
5. ✅ Investigations are 30%+ faster
6. ✅ Team rates it 7+/10
7. ✅ Would use it again (92%+)

---

## Quick Reference: Test Commands

```bash
# Check file structure
ls -la .claude/skills/skill-name/

# Validate YAML (visual check)
head -20 .claude/skills/skill-name/SKILL.md

# Check references (should list files)
grep -n "^See" .claude/skills/skill-name/SKILL.md
grep -n "^[[]" .claude/skills/skill-name/SKILL.md

# Check for Windows paths (should be empty)
grep -r '\\' .claude/skills/skill-name/

# Count lines (should be 400-600 for SKILL.md)
wc -l .claude/skills/skill-name/SKILL.md
```

---

You're ready to create, test, and deploy amazing skills for omni-ai! 🚀
