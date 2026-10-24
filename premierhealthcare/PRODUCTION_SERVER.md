# Production Django server

The public API should run under Gunicorn, not Django's development `runserver`.
The backend previously accumulated thousands of serving threads and thousands
of `CLOSE-WAIT` sockets. A bounded WSGI worker pool limits the impact of slow
or stuck requests; worker recycling is a safety net, not a substitute for
investigating any recurring request leak.

## Configuration

- `Requirements.txt` already includes `gunicorn`.
- `gunicorn.conf.py` binds to `127.0.0.1:8000`, keeps the worker count bounded,
  sets request timeouts, recycles workers, and sends logs to stdout/stderr.
- `ecosystem.config.cjs` lets PM2 supervise the backend process.

Loopback binding is intentional: Apache's existing reverse proxy connects to
`127.0.0.1:8000`. Do not run Gunicorn and `manage.py runserver` on the same port.

## Deploy on the current server

The current checkout layout uses the project directory
`/home/islammady/premierback/premierhealthcare` and virtual environment
`/home/islammady/premierback/venv`.

1. Confirm the current `manage.py runserver` parent/child PIDs with
   `ps -eo pid,ppid,nlwp,args | grep '[m]anage.py runserver'`. Stop only those
   verified PIDs gracefully; do not stop the frontend or Celery.
2. Check that port 8000 is free before starting Gunicorn.
3. Run PM2 as the application OS user (recommended, rather than running Django
   as root):

   ```bash
   sudo -u islammady pm2 start /home/islammady/premierback/premierhealthcare/ecosystem.config.cjs --only premier-backend
   sudo -u islammady pm2 save
   ```

   If Gunicorn is missing from that virtual environment, install the existing
   requirements first:
   
   ```bash
   sudo -u islammady /home/islammady/premierback/venv/bin/pip install -r /home/islammady/premierback/premierhealthcare/Requirements.txt
   ```

4. Verify the service and API:

   ```bash
   sudo -u islammady pm2 status
   curl --noproxy '*' -sS --max-time 8 -o /tmp/ivdrip.json \
     -w 'HTTP=%{http_code} TTFB=%{time_starttransfer}s TOTAL=%{time_total}s\n' \
     http://127.0.0.1:8000/api/iv-drip-therapy/
   ```

   Check that the response contains the actual active CMS products.

## Follow-up monitoring

Monitor PM2 logs, worker restarts, response latency, database connection counts,
and `CLOSE-WAIT` sockets after deployment. If resource counts rise again,
identify which request/view or dependency is blocking rather than repeatedly
restarting the process.
