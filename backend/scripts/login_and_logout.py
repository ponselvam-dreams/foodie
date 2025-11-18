#!/usr/bin/env python3
"""Simple test script: login via password endpoint then logout using refresh token header.

Usage:
    python3 backend/scripts/login_and_logout.py --email user@example.com --password secret

Options:
    --base-url    Base URL of the backend (default: http://127.0.0.1:8000)
    --email       User email (username for OAuth2 password grant)
    --password    User password
    --force       If set, will pass ?force=true to login to force creating a new session

This script uses the HTTP API (not cookies). It:
  1) POST /api/v1/auth/password (form data)
  2) Reads access_token and refresh_token from JSON response
  3) POST /api/v1/auth/logout with header x-refresh-token: <refresh>

Note: Requires the `requests` package to be installed in your environment.
"""

import argparse
import sys
import requests


def login(base_url: str, email: str, password: str, force: bool = False, timeout: int = 10):
    url = f"{base_url.rstrip('/')}/api/v1/auth/password"
    if force:
        url = url + "?force=true"
    data = {
        "username": email,
        "password": password,
    }
    headers = {"test_secret_key": "test_api_key_value"}
    try:
        resp = requests.post(url, data=data, headers=headers, timeout=timeout)
    except Exception as e:
        raise RuntimeError(f"Login request failed: {e}")
    try:
        payload = resp.json()
    except Exception:
        raise RuntimeError(f"Login returned non-JSON response: {resp.status_code}: {resp.text}")
    if resp.status_code != 200:
        raise RuntimeError(f"Login failed ({resp.status_code}): {payload}")
    # Expecting keys access_token and refresh_token
    access = payload.get("access_token")
    refresh = payload.get("refresh_token")
    if not refresh:
        raise RuntimeError(f"Login response missing refresh_token: {payload}")
    return payload


def logout(base_url: str, refresh_token: str, access_token: str = None, timeout: int = 10):
    url = f"{base_url.rstrip('/')}/api/v1/auth/logout"
    # headers = {"test_secret_key": "test_api_key_value"}
    headers ={}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    headers["x-refresh-token"] = refresh_token
    try:
        resp = requests.post(url, headers=headers, timeout=timeout)
    except Exception as e:
        raise RuntimeError(f"Logout request failed: {e}")
    try:
        payload = resp.json()
    except Exception:
        raise RuntimeError(f"Logout returned non-JSON response: {resp.status_code}: {resp.text}")
    # If the access token is expired the middleware may reject the request before the handler
    # can use the refresh token. In that case, retry without the Authorization header.
    if resp.status_code == 401 and access_token:
        # look for token expired message
        detail = None
        if isinstance(payload, dict):
            detail = payload.get("detail")
            # some frameworks wrap detail in a string
            if isinstance(detail, dict):
                detail = detail.get("detail") or detail.get("message")
        if detail and "expired" in str(detail).lower():
            # retry without Authorization header
            headers2 = {"x-refresh-token": refresh_token,
                        #  "test_secret_key": "test_api_key_value"
                         }
            try:
                resp2 = requests.post(url, headers=headers2, timeout=timeout)
            except Exception as e:
                raise RuntimeError(f"Logout retry failed: {e}")
            try:
                payload2 = resp2.json()
            except Exception:
                raise RuntimeError(f"Logout retry returned non-JSON response: {resp2.status_code}: {resp2.text}")
            if resp2.status_code not in (200, 201):
                raise RuntimeError(f"Logout retry failed ({resp2.status_code}): {payload2}")
            return payload2

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Logout failed ({resp.status_code}): {payload}")
    return payload


def main():
    p = argparse.ArgumentParser(description="Login then logout using refresh token")
    p.add_argument("--base-url", default="http://127.0.0.1:8000", help="Base URL of backend API")
    p.add_argument("--email", required=True, help="User email/username")
    p.add_argument("--password", required=True, help="User password")
    p.add_argument("--force", action="store_true", help="Force login (revoke previous session)")
    args = p.parse_args()

    try:
        print(f"Logging in {args.email} against {args.base_url} (force={args.force})...")
        tokens = login(args.base_url, args.email, args.password, force=args.force)
        print("Login successful. Tokens:")
        print("  access_token: <redacted>")
        print(f"  refresh_token: {tokens.get('refresh_token')}")

        access = tokens.get("access_token")
        refresh = tokens.get("refresh_token")

        print("Calling logout using refresh token header...")
        out = logout(args.base_url, refresh_token=refresh, access_token=access)
        print("Logout response:")
        print(out)
        print("Done.")
    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
