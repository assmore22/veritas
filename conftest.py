"""
Pytest configuration for VERITAS (direct runner, no network/wallet).
"""

import pytest
from gltest.direct.loader import deploy_contract as _direct_deploy_contract

SDK_VERSION = "v0.2.16"


@pytest.fixture
def deploy(direct_vm):
    def _deploy(contract_path, *args, **kwargs):
        kwargs.setdefault("sdk_version", SDK_VERSION)
        return _direct_deploy_contract(contract_path, direct_vm, *args, **kwargs)
    return _deploy


import os
import sys
import tempfile
import atexit
import gltest.direct.loader as _loader

_pending_temp_files: list[str] = []


def _inject_message_to_fd0_winsafe(vm) -> None:
    try:
        from genlayer.py import calldata
        from genlayer.py.types import Address
    except ImportError:
        return

    message_data = {
        "contract_address": Address(vm._contract_address) if isinstance(vm._contract_address, bytes) else vm._contract_address,
        "sender_address": Address(vm.sender) if isinstance(vm.sender, bytes) else vm.sender,
        "origin_address": Address(vm.origin) if isinstance(vm.origin, bytes) else vm.origin,
        "stack": [],
        "value": vm._value,
        "datetime": vm._datetime,
        "is_init": False,
        "chain_id": vm._chain_id,
        "entry_kind": 0,
        "entry_data": b"",
        "entry_stage_data": None,
    }

    encoded = calldata.encode(message_data)
    fd, path = tempfile.mkstemp()
    try:
        os.write(fd, encoded)
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
    finally:
        os.close(fd)
        try:
            os.unlink(path)
        except (PermissionError, OSError):
            _pending_temp_files.append(path)


def _cleanup_pending() -> None:
    for p in list(_pending_temp_files):
        try:
            os.unlink(p)
            _pending_temp_files.remove(p)
        except OSError:
            pass


if sys.platform.startswith("win"):
    _loader._inject_message_to_fd0 = _inject_message_to_fd0_winsafe
    atexit.register(_cleanup_pending)
