"""
Production Gunicorn configuration for the Premier Health Django API.

Apache already proxies API requests to 127.0.0.1:8000, so keep Gunicorn
on loopback rather than exposing the application server directly to the internet.
"""
bind = "127.0.0.1:8000"

# Bound concurrency: unlike runserver's per-request thread model, sync workers
# cannot grow into thousands of request threads.
workers = 3
worker_class = "sync"

# Recycle workers periodically so a long-lived worker cannot accumulate
# unbounded process-local resources.
max_requests = 1000
max_requests_jitter = 100

timeout = 60
graceful_timeout = 30
keepalive = 2

accesslog = "-"
errorlog = "-"
capture_output = True
loglevel = "info"
