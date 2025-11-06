# DataDog Query Patterns & Templates

Common query templates for different investigation scenarios.

## Error Investigation Patterns

### Error Rate Baseline
**Purpose**: See if service is experiencing errors.

```
sum:trace.web.request.errors{service:$SERVICE,env:$ENV} [$TIMERANGE]
```

**What it shows**:
- Total error count for the service
- Trend line shows if errors increasing/decreasing
- Spike indicates problem time window

**Example**:
```
sum:trace.web.request.errors{service:payment-service,env:prod} [1h]
```

Result: "1,247 errors in last hour"

---

### Error Distribution by Type
**Purpose**: What kind of errors are happening?

```
sum:trace.web.request.errors{service:$SERVICE,env:$ENV} [$TIMERANGE] by {error_type}
```

**What it shows**:
- Breakdown by error category (500, 503, timeout, etc.)
- Which error is dominant (80% 503? 60% timeout?)
- If multiple error types = multiple issues

**Example**:
```
sum:trace.web.request.errors{service:payment-service,env:prod} [1h] by {error_type}
```

Result:
```
500 Internal Server Error: 800 (64%)
503 Service Unavailable: 400 (32%)
504 Gateway Timeout: 47 (4%)
```

---

### Error Rate by Endpoint
**Purpose**: Which API endpoint is broken?

```
sum:trace.web.request.errors{service:$SERVICE,env:$ENV} [$TIMERANGE] by {resource}
```

**What it shows**:
- Broken endpoint has high error count
- Other endpoints working normally
- Helps pinpoint code issue

**Example**:
```
sum:trace.web.request.errors{service:payment-service,env:prod} [1h] by {resource}
```

Result:
```
POST /api/charges: 1,100 (88%)
POST /api/customers: 140 (11%)
GET /api/charges: 7 (1%)
```

---

### Error Rate Percentage
**Purpose**: What percentage of requests are failing?

```
(sum:trace.web.request.errors{service:$SERVICE,env:$ENV} / sum:trace.web.request.hits{service:$SERVICE,env:$ENV}) * 100
```

**What it shows**:
- User impact percentage
- 50% = half of users affected (critical)
- 5% = small subset affected (medium)

**Example**:
```
(sum:trace.web.request.errors{service:payment-service,env:prod} / sum:trace.web.request.hits{service:payment-service,env:prod}) * 100
```

Result: "42% of requests failed"

---

## Latency Investigation Patterns

### Latency Baseline (P95)
**Purpose**: See if service is slow.

```
pct_95:trace.web.request.duration{service:$SERVICE,env:$ENV} [$TIMERANGE]
```

**What it shows**:
- 95th percentile latency (what 95% of users experience)
- Better indicator than average (which can be skewed)
- If baseline 200ms and suddenly 5000ms = degradation

**Example**:
```
pct_95:trace.web.request.duration{service:payment-service,env:prod} [1h]
```

Result: "p95 latency = 2500ms (normally 200ms)"

---

### Latency Distribution (All Percentiles)
**Purpose**: Full latency picture.

```
pct_50:trace.web.request.duration{service:$SERVICE,env:$ENV} [$TIMERANGE]
pct_95:trace.web.request.duration{service:$SERVICE,env:$ENV} [$TIMERANGE]
pct_99:trace.web.request.duration{service:$SERVICE,env:$ENV} [$TIMERANGE]
```

**What it shows**:
- p50 = median (what half users see)
- p95 = slow users
- p99 = very slow users
- Large gap (p50=100ms, p99=10000ms) = outlier slow requests

**Example**:
```
p50: 150ms
p95: 2500ms
p99: 8000ms
```

Interpretation: Some requests very slow (outliers), most normal.

---

### Latency by Endpoint
**Purpose**: Which endpoint is slow?

```
pct_95:trace.web.request.duration{service:$SERVICE,env:$ENV} [$TIMERANGE] by {resource}
```

**What it shows**:
- Specific slow endpoint
- Other endpoints performing normally
- Helps identify problematic code path

---

### Latency Comparison (Before/After)
**Purpose**: Did latency improve after fix?

```
pct_95:trace.web.request.duration{service:$SERVICE,env:$ENV} [before_time]
pct_95:trace.web.request.duration{service:$SERVICE,env:$ENV} [after_time]
```

**What it shows**:
- Baseline before fix
- Current after fix
- If improved = fix is working

---

## Infrastructure Investigation Patterns

### CPU Usage Baseline
**Purpose**: Is service CPU-bound?

```
avg:system.cpu.user{service:$SERVICE} [$TIMERANGE]
avg:system.cpu.system{service:$SERVICE} [$TIMERANGE]
```

**What it shows**:
- Average CPU usage
- If spiking = process using more CPU
- If maxed out (95-100%) = bottleneck

**Example**:
```
avg:system.cpu.user{service:payment-service} [1h]
```

Result: "Average CPU went from 20% to 85% at 2:45 PM"

---

### Memory Usage Baseline
**Purpose**: Is service running out of memory?

```
avg:system.mem.used_pct{service:$SERVICE} [$TIMERANGE]
```

**What it shows**:
- Memory usage percentage
- If increasing over time = memory leak
- If at 95%+ = OOM risk

---

### Disk Usage Baseline
**Purpose**: Is disk running out of space?

```
avg:system.disk.used_pct{service:$SERVICE,device:/} [$TIMERANGE]
```

**What it shows**:
- Disk usage percentage
- >90% = warning
- Can cause service failures

---

### Network I/O
**Purpose**: Is network saturated?

```
avg:system.net.bytes_sent{service:$SERVICE} [$TIMERANGE]
avg:system.net.bytes_recv{service:$SERVICE} [$TIMERANGE]
```

**What it shows**:
- Network throughput
- Large spikes = possible DDoS or load spike
- High latency + high I/O = network bottleneck

---

## Availability & Uptime Patterns

### Error Rate for Uptime Calculation
**Purpose**: What was uptime percentage?

```
(sum:trace.web.request.hits{service:$SERVICE,env:$ENV} - sum:trace.web.request.errors{service:$SERVICE,env:$ENV}) / sum:trace.web.request.hits{service:$SERVICE,env:$ENV} * 100
```

**What it shows**:
- Uptime percentage (SLA metric)
- 99.9% = acceptable
- 95% = significant outage

**Example**:
```
Result: 97.5% uptime during incident
```

---

### Downtime Duration
**Purpose**: How long was service down?

Look at error graph, find spike start/end time.

```
sum:trace.web.request.errors{service:$SERVICE,env:$ENV} [timewindow_including_spike]
```

**Reading the graph**:
- Errors start at: 2:45 PM
- Errors return to normal at: 3:15 PM
- Downtime duration: 30 minutes

---

## Cross-Service & Dependency Patterns

### Service Dependency Health
**Purpose**: Is downstream dependency broken?

```
# Query your service
sum:trace.web.request.errors{service:payment-service,env:prod} [1h]

# Query dependency
sum:trace.web.request.errors{service:database-service,env:prod} [1h]
sum:trace.web.request.errors{service:cache-service,env:prod} [1h]
```

**What it shows**:
- If your errors correlate with dependency errors
- Dependency issue = root cause of your errors
- Helps pinpoint multi-service issues

---

### Dependency Latency
**Purpose**: Is slowness from downstream?

```
pct_95:trace.web.request.duration{service:payment-service,env:prod} [1h]
pct_95:trace.web.request.duration{service:database-service,env:prod} [1h]
```

**What it shows**:
- If payment service latency increased when database got slow
- Helps identify slowdown source

---

## Correlation Patterns

### Error Rate + Infrastructure Correlation
**Purpose**: Are errors caused by resource exhaustion?

```
sum:trace.web.request.errors{service:$SERVICE} [timewindow] by {host}
avg:system.cpu.user{service:$SERVICE} [timewindow] by {host}
```

**What it shows**:
- If host with errors also has high CPU
- Clear indicator of resource exhaustion
- Fix: Scale up or optimize resource usage

---

### Error Rate + Deployment Correlation
**Purpose**: Did errors start after deployment?

```
sum:trace.web.request.errors{service:$SERVICE} [4h]  # Last 4 hours
```

Then:
1. Find error spike time (e.g., 2:45 PM)
2. Check Events API for deployments around that time
3. If deployment within 5 minutes of error spike = correlation

---

### Latency + Deployment Correlation
**Purpose**: Did latency increase after deployment?

```
pct_95:trace.web.request.duration{service:$SERVICE} [4h]
```

Then correlate with deployment timeline (look for version change in traces).

---

## Template Reference

Use these templates for quick copy-paste:

### Basic Error Check
```
sum:trace.web.request.errors{service:SERVICE,env:ENV} [1h]
```

### Full Latency Picture
```
pct_50:trace.web.request.duration{service:SERVICE,env:ENV} [1h]
pct_95:trace.web.request.duration{service:SERVICE,env:ENV} [1h]
pct_99:trace.web.request.duration{service:SERVICE,env:ENV} [1h]
```

### Infrastructure Baseline
```
avg:system.cpu.user{service:SERVICE} [1h]
avg:system.mem.used_pct{service:SERVICE} [1h]
avg:system.disk.used_pct{service:SERVICE,device:/} [1h]
```

### Complete Diagnosis (Copy All 5)
```
sum:trace.web.request.errors{service:SERVICE,env:prod} [1h]
pct_95:trace.web.request.duration{service:SERVICE,env:prod} [1h]
avg:system.cpu.user{service:SERVICE} [1h]
sum:trace.web.request.hits{service:SERVICE,env:prod} [1h]
avg:system.mem.used_pct{service:SERVICE} [1h]
```

Run these 5 queries in parallel to get complete picture.

---

## Pro Tips

1. **Always query by service first**: Most issues are service-specific
2. **Always filter by env**: Prod vs staging behave differently
3. **p95 > average**: Use p95 for realistic user experience
4. **Group by trending metric**: Error type, endpoint, host
5. **Compare time windows**: Before issue vs during issue

---

**Remember**: These are templates. Always substitute:
- `$SERVICE` - Your service name (e.g., `payment-service`)
- `$ENV` - Environment (e.g., `prod`, `staging`)
- `$TIMERANGE` - Time window (e.g., `[1h]`, `[4h]`)
