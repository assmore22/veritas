"""
Deploy the VERITAS contract to the configured GenLayer network (studionet).

Initializes the gltest general config from gltest.config.yaml exactly like the
pytest plugin, builds the contract factory from contracts/veritas.py, deploys
with the dev account, and writes the deployed address to artifacts/deployment.json.

Usage:
    python scripts/deploy.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _init_config():
    from gltest_cli.config.plugin import load_user_config, get_general_config, PluginConfig

    user_config = load_user_config(str(ROOT / "gltest.config.yaml"))
    gc = get_general_config()
    gc.user_config = user_config

    plugin_config = PluginConfig()
    plugin_config.contracts_dir = ROOT / "contracts"
    plugin_config.artifacts_dir = ROOT / "artifacts"
    plugin_config.default_wait_interval = None
    plugin_config.default_wait_retries = None
    plugin_config.rpc_url = None
    plugin_config.network_name = None
    plugin_config.leader_only = False
    plugin_config.chain_type = None
    gc.plugin_config = plugin_config
    return gc


def main():
    _init_config()
    from gltest import get_contract_factory, get_default_account
    from gltest.clients import get_gl_client

    account = get_default_account()
    client = get_gl_client()
    print("Deployer:", account.address)
    print("Balance (GEN):", int(client.get_balance(account.address)) / 10**18)

    factory = get_contract_factory(
        contract_file_path=str(ROOT / "contracts" / "veritas.py")
    )
    print("Deploying VERITAS...")
    contract = factory.deploy(args=[], account=account)
    addr = contract.address
    print("Deployed at:", addr)

    # Smoke-check a couple of view methods on the live contract.
    try:
        owner = contract.get_owner(args=[]).call()
        print("owner view ->", owner)
    except Exception as e:
        print("owner view failed:", repr(e))
    try:
        count = contract.get_case_count(args=[]).call()
        print("get_case_count ->", count)
    except Exception as e:
        print("get_case_count failed:", repr(e))

    out = {
        "network": "studionet",
        "rpc_url": "https://studio.genlayer.com/api",
        "address": str(addr),
        "deployer": str(account.address),
    }
    # Write to project root: the artifacts/ dir is wiped by the pytest plugin
    # on every test session, so it is not a durable place for this record.
    (ROOT / "deployment.json").write_text(json.dumps(out, indent=2))
    print("Wrote deployment.json")
    return out


if __name__ == "__main__":
    main()
