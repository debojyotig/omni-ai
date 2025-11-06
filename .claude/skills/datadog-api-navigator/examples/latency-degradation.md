# Example: Latency Degradation Investigation

**Scenario**: Search service is slow. p95 latency went from 200ms to 5 seconds. Errors are low. What's happening?

**Severity**: High (user experience impacted, but not erroring)

---

## Phase 1: Problem Scope

**What we know**:
- Service: `search-service`
- Environment: `prod`
- Issue: Slow requests (p95: 200ms → 5000ms)
- Errors: Low (<1%, so not crashing)
- Reported: "Search is sluggish"
- Time window: Last 4 hours (gradual vs sudden?)

---

## Phase 2: Data Collection

### Query 1: Latency Trend

```
pct_95:trace.web.request.duration{service:search-service,env:prod} [4h]
pct_99:trace.web.request.duration{service:search-service,env:prod} [4h]
```

**Result**:
```
Time-series shows GRADUAL increase:
- 10:00 AM: p95=180ms, p99=400ms
- 11:00 AM: p95=250ms, p99=600ms
- 12:00 PM: p95=800ms, p99=2000ms
- 1:00 PM: p95=2000ms, p99=5000ms
- 2:00 PM: p95=5000ms, p99=9000ms (current)
```

**Interpretation**: Not a sudden crash, but gradual degradation over 4 hours. Suggests:
- Not a code deployment (would be sudden)
- Likely a resource leak or load increase
- System is slowly exhausting resources

---

### Query 2: Error Rate (Confirm No Errors)

```
sum:trace.web.request.errors{service:search-service,env:prod} [4h]
```

**Result**:
```
Baseline: 5-10 errors/min (queries with no results)
During slowdown: 5-10 errors/min (unchanged)
```

**Interpretation**: No correlation with latency. Not a code/logic issue.

---

### Query 3: Search Complexity (By Endpoint)

```
pct_95:trace.web.request.duration{service:search-service,env:prod} [4h] by {resource}
```

**Result**:
```
GET /api/search?q=simple: p95=180ms (fast)
GET /api/search?q=complex: p95=5000ms (slow)
GET /api/search/filters: p95=300ms (normal)
GET /api/search/autocomplete: p95=2000ms (affected)
```

**Interpretation**:
- Simple searches still fast
- Complex searches very slow
- Autocomplete also slow
- Suggests: Database/cache under load

---

### Query 4: Infrastructure Health

```
avg:system.cpu.user{service:search-service} [4h]
avg:system.mem.used_pct{service:search-service} [4h]
avg:system.disk.used_pct{service:search-service,device:/} [4h]
```

**Result**:
```
CPU: Flat at 15% (not maxed out)
Memory: Increasing from 30% → 90% (smoking gun!)
Disk: Flat at 45%
```

**Interpretation**: Memory steadily increasing = likely memory leak. Process consuming more memory over time.

---

### Query 5: Request Volume

```
sum:trace.web.request.hits{service:search-service,env:prod} [4h]
```

**Result**:
```
10:00 AM: 2000 req/min
11:00 AM: 2100 req/min
12:00 PM: 2050 req/min
1:00 PM: 2150 req/min
2:00 PM: 2080 req/min
```

**Interpretation**: No volume spike. Load constant. So not "more traffic = slower".

---

## Phase 3: Pattern Analysis

**Key observations**:
1. ✅ Gradual latency increase (not sudden)
2. ✅ Memory steadily increasing (memory leak!)
3. ✅ No error correlation (not crashing)
4. ✅ Complex searches more affected (larger memory operations)
5. ✅ Constant request volume

**Hypothesis**: Memory leak in search-service. As memory fills up:
- JVM garbage collection pauses increase
- Page faults increase (memory swapping)
- Request processing slows down
- Eventually will crash (OOM)

---

## Phase 4: Root Cause Determination

### Query Span-Level Details

```
GET /api/v2/traces?filter[query]=service:search-service resource:GET%20/api/search
```

**Sample trace from slow search**:
```json
{
  "trace_id": "slow-search-123",
  "timestamp": "2025-11-06T14:30:00Z",
  "service": "search-service",
  "resource": "GET /api/search?q=programming",
  "duration": 5200,
  "spans": [
    {
      "operation": "parse_query",
      "duration": 50,
      "memory_before": "89% (900MB/1GB)"
    },
    {
      "operation": "query_elasticsearch",
      "duration": 4500,
      "memory_during": "92% (920MB/1GB)",
      "notes": "Long pause for GC"
    },
    {
      "operation": "format_results",
      "duration": 600,
      "memory_after": "91% (910MB/1GB)"
    }
  ]
}
```

**Reading the trace**:
- Query itself is fast (Elasticsearch returns in 100ms)
- But Java GC pause during execution = 4400ms latency added
- Memory at 92% triggers full GC
- GC pause locks thread for 4+ seconds

**Root cause identified**: Memory leak + aggressive GC = latency.

---

### Memory Leak Location

Check application heap metrics:

```
avg:jvm.heap.used{service:search-service,env:prod} [4h]
```

**Result**: Heap grows monotonically from 100MB → 850MB over 4 hours without returning to baseline.

**Heap pattern indicates**:
- Objects not being garbage collected
- Memory retained after request completes
- Classic memory leak

**Code location** (from profiler, not DataDog):
- Search results cache not evicting old entries
- Cache size unbounded
- Eventually fills entire heap

---

## Phase 5: Impact Assessment

### User Impact
```
Affected searches: All complex searches
Impact percentage: 60% of queries (complex queries)
User experience: 5-10 second wait (unacceptable)
Lost traffic: Estimate 15-20% abandon rate at 5s latency
```

### Severity
- **High**: 60% of users seeing 5+ second delays
- **Not Critical**: Service still responding (no errors)
- **Trend**: Getting worse (memory at 90%, OOM crash imminent)

---

## Resolution & Follow-up

### Immediate Action
1. **Restart service**: Clears memory leak immediately
2. **Monitor memory**: Watch for leak reappearing
3. **Reduce cache size**: Temporary fix until root cause patched
4. **Alert on memory**: Set threshold at 80% to catch before users affected

### Root Cause Fix
- **Short term**: Clear cache entries older than 1 hour
- **Medium term**: Implement proper cache eviction policy (LRU)
- **Long term**: Add memory profiling to CI/CD

### Prevention
- Unit tests for memory leaks (mock large result sets)
- Heap dump analysis in staging before production
- Alerting on memory trend (not just threshold)
- Weekly GC pause monitoring

---

## Comparison: Latency vs Errors

This example is interesting because:

| Metric | Error Spike | Latency Spike |
|--------|-------------|---------------|
| **Root Cause** | Blocked I/O (sync call) | Resource leak (memory) |
| **How It Appears** | Sudden (after deploy) | Gradual (over hours) |
| **Error Rate** | Increases | Stays low |
| **Infrastructure** | CPU spikes | Memory increases |
| **Fix Type** | Code change (immediate) | Restart + code change |
| **Detection Time** | Minutes (obvious) | Hours (hidden by low errors) |

**Key lesson**: Latency without errors is dangerous because it degrades user experience invisibly. Error-based monitoring would miss this.

---

## Actual Resolution

### Actions Taken
1. **11:00 AM**: Memory alert triggered (memory >85%)
2. **11:05 AM**: Restarted search-service instances (rolling restart)
3. **11:10 AM**: Latency back to 200ms
4. **11:15 AM**: Memory stable at 30% (initial state)
5. **2:00 PM**: Deployed fix (cache eviction policy)
6. **2:05 PM**: Verified fix (no memory increase over 1 hour)

### Prevention Going Forward
- Added JVM memory monitoring (heap trend)
- Cache eviction tests in CI
- Memory profiling gate in staging
- Alerts on GC pause duration (not just frequency)

---

**Key Takeaway**: Memory-induced latency is subtle because:
1. No errors reported
2. Service appears healthy
3. Gradually gets worse
4. Harder to correlate with specific change
5. Solution: Monitor memory trend + GC metrics, not just request latency
