#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/base.py
import asyncio
from functools import wraps


def async_task(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))

    return wrapper
