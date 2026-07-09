#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/utils/geo.py
from __future__ import annotations

from math import atan2, cos, radians, sin, sqrt

from geoalchemy2.functions import ST_MakePoint, ST_SetSRID


SRID = 4326
EARTH_RADIUS_METERS = 6_371_000


def make_geo_point(lat: float, lng: float):
    """
    Builds the SQLAlchemy/PostGIS geography point expression used on Complaint.geo_point.
    Centralized here so every insertion path (sync ingest, async ingest, future
    bulk-import scripts) constructs points identically.
    """
    return ST_SetSRID(ST_MakePoint(lng, lat), SRID)


def haversine_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Pure-Python great-circle distance. Used for unit tests / sanity checks against
    ST_DWithin results without needing a live database.
    """
    phi1, phi2 = radians(lat1), radians(lat2)
    d_phi = radians(lat2 - lat1)
    d_lambda = radians(lng2 - lng1)
    a = sin(d_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_METERS * atan2(sqrt(a), sqrt(1 - a))


def bounding_box(lat: float, lng: float, radius_meters: float) -> dict[str, float]:
    """
    Cheap degree-based bounding box for the given radius. Optional index-friendly
    pre-filter (WHERE lat BETWEEN ... AND lng BETWEEN ...) ahead of an exact ST_DWithin
    check, useful if the complaints table grows past a few million rows and the GIST
    index alone isn't narrowing the candidate set enough.
    """
    lat_delta = radius_meters / 111_320  # ~meters per degree of latitude
    lng_delta = radius_meters / (111_320 * cos(radians(lat)) or 1e-9)
    return {
        "min_lat": lat - lat_delta,
        "max_lat": lat + lat_delta,
        "min_lng": lng - lng_delta,
        "max_lng": lng + lng_delta,
    }
