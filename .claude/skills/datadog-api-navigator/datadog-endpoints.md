# DataDog API Endpoints Reference

Complete reference for DataDog API endpoints used in investigations.

## Core Query Endpoint

### POST /api/v1/query
Query metrics and aggregated data.

**Parameters**:
- `query` (required): Query string
- `from` (required): Unix timestamp, seconds since epoch
- `to` (required): Unix timestamp, seconds since epoch

**Example**:
```bash
curl -X POST "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: ${API_KEY}" \
  -H "DD-APPLICATION-KEY: ${APP_KEY}" \
  -d '{
    "query": "avg:system.cpu.user{*}",
    "from": 1234567890,
    "to": 1234567890
  }'
```

**Response**:
```json
{
  "status": "ok",
  "res_type": "time_series",
  "series": [
    {
      "metric": "system.cpu.user",
      "attributes": {},
      "display_name": "system.cpu.user",
      "unit": null,
      "pointlist": [[1234567890000, 1.5], ...]
    }
  ]
}
```

## Trace API Endpoints

### GET /api/v2/traces
Query APM traces.

**Query Parameters**:
- `filter[query]` - Filter string (e.g., `service:payment error_type:500`)
- `page[limit]` - Max results (default 10, max 100)
- `page[offset]` - Pagination offset
- `sort` - Sort order (e.g., `-timestamp`)

**Example Filter Terms**:
- `service:payment-service`
- `error_type:500`
- `status_code:503`
- `span_kind:server`

**Example**:
```bash
curl "https://api.datadoghq.com/api/v2/traces?filter[query]=service:payment_error_type:500" \
  -H "DD-API-KEY: ${API_KEY}"
```

### GET /api/v2/traces/:trace_id
Get a specific trace with all spans.

**Example**:
```bash
curl "https://api.datadoghq.com/api/v2/traces/abc123" \
  -H "DD-API-KEY: ${API_KEY}"
```

## Monitor API Endpoints

### GET /api/v1/monitor
List monitors.

**Query Parameters**:
- `name` - Filter by name
- `tags` - Filter by tags (comma-separated)
- `status` - Filter by status (ok, alert, no_data)

**Example**:
```bash
curl "https://api.datadoghq.com/api/v1/monitor?name=payment&status=alert" \
  -H "DD-API-KEY: ${API_KEY}" \
  -H "DD-APPLICATION-KEY: ${APP_KEY}"
```

### GET /api/v1/monitor/:monitor_id
Get specific monitor details.

**Response**:
```json
{
  "id": 123456,
  "name": "Payment Service Error Rate",
  "type": "metric alert",
  "query": "avg:trace.web.request.errors{service:payment} > 10",
  "status": "alert",
  "state": "triggered",
  "message": "Payment service experiencing high error rate"
}
```

### GET /api/v1/monitor/statuses
Get status of all monitors.

**Returns**: List of monitors with current status and last alert time.

## RUM API Endpoints

### GET /api/v2/rum/events
Query RUM events (sessions, views, errors).

**Query Parameters**:
- `filter[query]` - Filter (e.g., `service:web @type:error`)
- `page[limit]` - Max results (default 10, max 100)
- `sort` - Sort order

**Example Filter Terms**:
- `@type:error` - Only errors
- `@type:view` - Page views
- `status:4xx` - Client errors
- `status:5xx` - Server errors

**Example**:
```bash
curl "https://api.datadoghq.com/api/v2/rum/events?filter[query]=@type:error" \
  -H "DD-API-KEY: ${API_KEY}"
```

## Infrastructure API Endpoints

### GET /api/v1/hosts
List infrastructure hosts.

**Query Parameters**:
- `filter` - Filter by hostname or tag
- `include_muted_hosts` - Include muted hosts

**Example**:
```bash
curl "https://api.datadoghq.com/api/v1/hosts?filter=service:payment" \
  -H "DD-API-KEY: ${API_KEY}" \
  -H "DD-APPLICATION-KEY: ${APP_KEY}"
```

### GET /api/v1/hosts/:host_id
Get host details and metrics.

## Service Catalog API

### GET /api/v2/services/definitions
List all services and their definitions.

**Example**:
```bash
curl "https://api.datadoghq.com/api/v2/services/definitions" \
  -H "DD-API-KEY: ${API_KEY}"
```

**Returns**: List of services, owners, tags, SLOs.

## Dashboard API

### GET /api/v1/dashboard
List dashboards.

**Query Parameters**:
- `filter` - Filter by name
- `tags` - Filter by tags

### GET /api/v1/dashboard/:dashboard_id
Get specific dashboard definition.

**Returns**: Dashboard structure with all widgets, queries, and layout.

## Events API

### GET /api/v1/events
Query events (deployments, config changes, alerts).

**Query Parameters**:
- `start` - Unix timestamp
- `end` - Unix timestamp
- `priority` - Filter by priority (low, normal, high)
- `tags` - Filter by tags

**Example**:
```bash
curl "https://api.datadoghq.com/api/v1/events?tags=deployment" \
  -H "DD-API-KEY: ${API_KEY}" \
  -H "DD-APPLICATION-KEY: ${APP_KEY}"
```

**Returns**: Deployments, config changes, monitor alerts with timestamps.

## Authentication

All endpoints require:

```bash
# API Key (required)
-H "DD-API-KEY: your-api-key"

# Application Key (required for some endpoints)
-H "DD-APPLICATION-KEY: your-app-key"
```

## Rate Limits

- **Query requests**: 100 requests/sec
- **Metric queries**: 1000 requests/min
- **Monitor endpoints**: 10 requests/sec

**Rate limit response headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

If rate limited, response is:
```
HTTP 429 Too Many Requests
```

## Error Responses

### 400 Bad Request
Query syntax error or missing parameters.

```json
{
  "status": "error",
  "error": "Invalid query: syntax error at position 15"
}
```

### 401 Unauthorized
Invalid or missing API key.

### 404 Not Found
Resource not found (monitor, trace, dashboard).

### 429 Too Many Requests
Rate limit exceeded. Retry after delay or reduce query scope.

## Base URLs

- **US**: `https://api.datadoghq.com`
- **EU**: `https://api.datadoghq.eu`

Verify which region your DataDog account uses.

## Useful Query Time Ranges

For common investigation windows:

- Last 1 hour: `from: now - 1h`, `to: now`
- Last 4 hours: `from: now - 4h`, `to: now`
- Last 24 hours: `from: now - 1d`, `to: now`
- Last 7 days: `from: now - 7d`, `to: now`

Maximum: 90 days back. Older data requires Archive functionality.

---

**Note**: This is a simplified reference. Always refer to the official DataDog API documentation at `docs.datadoghq.com/api/` for the most current endpoint definitions and parameters.
