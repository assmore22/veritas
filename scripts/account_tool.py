"""
Account utility for VERITAS on GenLayer studionet.

Initializes the gltest general config from gltest.config.yaml (the same way the
pytest plugin does), then exposes balance lookup and faucet funding for the dev
wallet defined in .env.

Usage:
    python scripts/account_tool.py balance
    python scripts/account_tool.py fund
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _init_config():
    from gltest_cli.config.plugin import load_user_config, get_general_config
    from gltest_cli.config.plugin import PluginConfig

    cfg_path = ROOT / "gltest.config.yaml"
    user_config = load_user_config(str(cfg_path))
    gc = get_general_config()
    gc.user_config = user_config

    plugin_config = PluginConfig()
    plugin_config.contracts_dir = None
    plugin_config.artifacts_dir = None
    plugin_config.default_wait_interval = None
    plugin_config.default_wait_retries = None
    plugin_config.rpc_url = None
    plugin_config.network_name = None
    plugin_config.leader_only = False
    plugin_config.chain_type = None
    gc.plugin_config = plugin_config
    return gc


def _client_and_account():
    from gltest.clients import get_gl_client, get_default_account
    acct = get_default_account()
    client = get_gl_client()
    return client, acct


def cmd_balance():
    _init_config()
    client, acct = _client_and_account()
    addr = acct.address
    print("Address:", addr)
    try:
        b = client.get_balance(addr)
        print("Balance (wei):", b)
        print("Balance (GEN):", int(b) / 10**18)
        return int(b)
    except Exception as e:
        print("get_balance failed:", repr(e))
        print("client methods:", [m for m in dir(client) if not m.startswith("_")])
        raise


def cmd_fund():
    _init_config()
    client, acct = _client_and_account()
    addr = acct.address
    print("Funding address:", addr)
    for name in ("fund_account", "request_funds", "faucet", "gen_faucet"):
        fn = getattr(client, name, None)
        if callable(fn):
            print(f"Using client.{name}()")
            try:
                res = fn(addr)
                print("result:", res)
                return res
            except Exception as e:
                print(f"{name} failed:", repr(e))
    raise SystemExit("No faucet method found on client; methods: "
                     + str([m for m in dir(client) if not m.startswith("_")]))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "balance"
    if cmd == "balance":
        cmd_balance()
    elif cmd == "fund":
        cmd_fund()
    else:
        print("unknown command", cmd)
