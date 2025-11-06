# Example: Error Spike Investigation

**Scenario**: Payment service started returning 50% errors at 2:45 PM. Need to find root cause.

**Severity**: Critical (customer impacting)

---

## Phase 1: Problem Scope (5 minutes)

**What we know**:
- Service: `payment-service`
- Environment: `prod`
- Issue: 50% error rate (should be <0.1%)
- Time: Started at 2:45 PM (Nov 6, 2025)
- Impact: All payment processing affected

**What we need to find**:
- What kind of errors?
- What changed at 2:45 PM?
- Where is the root cause?

---

## Phase 2: Data Collection (10-15 minutes)

### Query 1: Error Rate Baseline

```
sum:trace.web.request.errors{service:payment-service,env:prod} [1h]
```

**Result**:
```
Time-series data showing:
- 1:45 PM - 2:45 PM: ~5 errors/min (baseline)
- 2:45 PM: Spike begins
- 3:00 PM: Peak of ~600 errors/min
- 3:15 PM: Returns to baseline
- Total: 1,247 errors in spike window
```

**Interpretation**: Clear spike starting at 2:45 PM, lasting 30 minutes.

---

### Query 2: Error Type Distribution

```
sum:trace.web.request.errors{service:payment-service,env:prod} [1h] by {error_type}
```

**Result**:
```
500 Internal Server Error: 800 (64%)
503 Service Unavailable: 400 (32%)
504 Gateway Timeout: 47 (4%)
```

**Interpretation**:
- Mostly 500s (application error) + 503s (service unavailable)
- Not network timeout (few 504s)
- Application code or critical dependency issue

---

### Query 3: Latency Percentiles

```
pct_95:trace.web.request.duration{service:payment-service,env:prod} [1h]
pct_99:trace.web.request.duration{service:payment-service,env:prod} [1h]
```

**Result**:
```
Before 2:45 PM: p95=200ms, p99=500ms (normal)
2:45-3:15 PM: p95=8000ms, p99=30000ms (very slow)
After 3:15 PM: p95=200ms, p99=500ms (back to normal)
```

**Interpretation**:
- Errors AND latency spiked together
- Classic sign of resource exhaustion
- Suggests: Either process maxed out OR dependency is failing

---

### Query 4: Infrastructure Health

```
avg:system.cpu.user{service:payment-service} [1h]
avg:system.mem.used_pct{service:payment-service} [1h]
```

**Result**:
```
CPU:
Before 2:45 PM: ~20%
2:45-3:15 PM: ~95% (maxed out!)
After 3:15 PM: ~20%

Memory:
Before 2:45 PM: ~40%
2:45-3:15 PM: ~40% (unchanged)
After 3:15 PM: ~40%
```

**Interpretation**:
- CPU maxed out during error spike
- Memory stable = not a memory issue
- CPU exhaustion = bottleneck identified
- But what caused CPU to spike?

---

### Query 5: Deployment Check

Check Events API for deployments around 2:45 PM:

```
GET /api/v1/events?tags=deployment&start=1673016300&end=1673020200
```

**Result**:
```
2:40 PM: Deployment of payment-service v2.3
  - SHA: abc123def456
  - Changes: Validation logic refactor, added customer balance check
2:45 PM: payment-service crash begins (5 min after deploy)
3:15 PM: Rollback to v2.2
3:16 PM: Error rate returns to normal
```

**Interpretation**:
- Deployment at 2:40 PM
- Errors start 5 minutes later
- Rollback stops errors immediately
- Clear correlation: v2.3 deployment caused issue

---

## Phase 3: Pattern Analysis (10-15 minutes)

**Key observations**:
1. ✅ Errors + Latency both spiked (not just code issue)
2. ✅ CPU maxed out (resource exhaustion)
3. ✅ Timing matches v2.3 deployment
4. ✅ Rollback fixed immediately

**Hypothesis**: v2.3 introduced infinite loop or expensive operation causing CPU exhaustion.

---

## Phase 4: Root Cause Determination (5-10 minutes)

### Detailed Investigation

Query traces for errors during spike:

```
GET /api/v2/traces?filter[query]=service:payment-service error_type:500
```

**Sample trace from spike**:
```json
{
  "trace_id": "xyz789",
  "timestamp": "2025-11-06T14:47:23Z",
  "service": "payment-service",
  "resource": "POST /api/charges",
  "error": {
    "type": "InternalServerError",
    "message": "Request timeout - validation service unresponsive"
  },
  "spans": [
    {
      "operation": "validate_customer_balance",
      "duration": 29500,
      "status": "timeout"
    },
    {
      "operation": "charge_card",
      "duration": 100,
      "status": "not_executed"
    }
  ]
}
```

**Reading the trace**:
- `validate_customer_balance` span taking 29.5 seconds (should be <100ms)
- Timeout killing the request
- Never reaches `charge_card` operation

**Root cause found**: v2.3's new customer balance validation is:
1. Making synchronous call to validation service
2. Validation service is slow/overloaded
3. Each request hangs for 30 seconds
4. Connection pool exhausted
5. New requests queue up = CPU maxes out

---

### Cross-Dependency Check

Query validation service:

```
sum:trace.web.request.errors{service:validation-service,env:prod} [1h]
avg:trace.web.request.duration{service:validation-service,env:prod} [1h]
```

**Result**:
```
Error rate: 0.5% (normal)
Latency: ~30 seconds (abnormally high!)
```

**Interpretation**: Validation service is slow, not erroring. This cascades to payment-service as timeouts.

---

## Phase 5: Impact Assessment (5 minutes)

### Error Rate Calculation
```
(1,247 errors / 2,500 total requests) × 100 = 49.88%
≈ 50% error rate confirmed
```

### User Impact
```
Affected customers: All during 2:45-3:15 PM window
Lost transactions: ~1,250 charges
Lost revenue: ~$37,500 (assuming $30/transaction average)
Duration: 30 minutes
```

### Severity
- **Critical**: 50% error rate, 30 minutes duration, $37K loss
- **SLA Impact**: Violated 99.9% uptime SLA for the day

---

## Resolution & Follow-up

### Immediate Action (Already taken)
- ✅ Rolled back to v2.2 at 3:15 PM
- ✅ Error rate returned to normal
- ✅ Customers notified of incident

### Root Cause
- v2.3 added synchronous validation call without timeout/retry logic
- Validation service has performance issues (separate investigation)
- No load testing for new synchronous dependency

### Fix
1. **Short term**: Deploy v2.3 with timeout (5 seconds max) for validation call
2. **Medium term**: Make validation call asynchronous with fallback
3. **Long term**: Investigate validation service performance
4. **Process**: Add dependency load testing to CI/CD pipeline

### Prevention
- Code review should catch blocking I/O calls
- Load testing should expose performance issues
- Gradual rollout (canary) would have caught this earlier
- Add monitoring for validation service latency

---

## Lessons Learned

1. **CPU spike + errors = resource bottleneck**: Almost always a sign of exhausted connection pool or infinite loop
2. **Correlation matters**: Deployment timing + error timing = strong evidence
3. **Traces are gold**: Span-level detail identified exact slow operation
4. **Dependencies are invisible**: Service A can fail due to Service B being slow
5. **Rollout strategy**: Canary deployment would have caught in 1% of users, not 100%

---

## Time Summary

- **Investigation time**: 30 minutes start to root cause
- **Resolution time**: 30 minutes (rollback took 2 minutes, rest was diagnosis)
- **Total impact**: 60 minutes (2x investigation + resolution)
- **Cost**: ~$37K in lost transactions

With proper monitoring (latency + error alerts on new deployments), this would have been caught in seconds.

---

**Key Takeaway**: When errors + latency spike together after deployment, always check:
1. Deployment changelog
2. New dependency calls in deployment
3. Performance of those dependencies
4. Connection pool settings
