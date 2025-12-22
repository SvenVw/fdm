---
"@svenvw/fdm-app": patch
---

Fix AggregateError in Elevation Atlas by implementing chunked concurrency for sampling requests to avoid exceeding HTTP/1.1 connection limits
