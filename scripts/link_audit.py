#!/usr/bin/env python3
import argparse
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta

DEFAULT_URLS = [
    "http://localhost:3000/",
    "http://localhost:8000/health",
    "http://localhost:8000/api/datasets"
]


def check_url(url, timeout=10):
    start = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            status = response.getcode()
            body = response.read(64)
            elapsed = time.monotonic() - start
            return True, status, elapsed, body
    except urllib.error.HTTPError as e:
        return False, e.code, time.monotonic() - start, str(e).encode("utf-8")
    except urllib.error.URLError as e:
        return False, None, time.monotonic() - start, str(e).encode("utf-8")
    except Exception as e:
        return False, None, time.monotonic() - start, str(e).encode("utf-8")


def log_line(message, logfile=None):
    timestamp = datetime.utcnow().isoformat() + "Z"
    entry = f"[{timestamp}] {message}"
    print(entry)
    if logfile:
        logfile.write(entry + "\n")
        logfile.flush()


def run_monitor(urls, interval, duration, output_path):
    end_time = datetime.utcnow() + timedelta(seconds=duration)
    failures = 0
    total_checks = 0

    with open(output_path, "a", encoding="utf-8") as logfile:
        log_line(f"Starting link audit for {duration} seconds with interval {interval}s", logfile)
        log_line(f"URLs: {urls}", logfile)

        while datetime.utcnow() < end_time:
            for url in urls:
                total_checks += 1
                ok, status, elapsed, body = check_url(url)
                if ok and status == 200:
                    log_line(f"OK {url} status={status} time={elapsed:.3f}s", logfile)
                else:
                    failures += 1
                    log_line(
                        f"FAIL {url} status={status} time={elapsed:.3f}s detail={body.decode('utf-8', errors='replace')}" ,
                        logfile
                    )
            if datetime.utcnow() + timedelta(seconds=interval) > end_time:
                break
            time.sleep(interval)

        log_line(
            f"Audit complete: total_checks={total_checks}, failures={failures}",
            logfile,
        )

    return failures == 0


def parse_args():
    parser = argparse.ArgumentParser(description="Monitor HTTP endpoints continuously.")
    parser.add_argument(
        "--urls",
        nargs="+",
        default=DEFAULT_URLS,
        help="List of URLs to monitor. Defaults to frontend and backend health endpoints.",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Seconds between checks.",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=259200,
        help="Total duration in seconds (72h by default).",
    )
    parser.add_argument(
        "--log",
        default="link_audit.log",
        help="Path to output log file.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    success = run_monitor(args.urls, args.interval, args.duration, args.log)
    if success:
        print("Link audit completed successfully.")
        return 0
    print("Link audit detected failures.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
