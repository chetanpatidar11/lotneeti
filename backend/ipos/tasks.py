"""Coordinated source synchronization; provider failures remain isolated."""

import os
from io import StringIO

from celery import shared_task
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.utils import timezone

from ipos.models import IPO, IPOProviderSyncState
from ipos.sebi_filings import sync_sebi_index


def _locked(name, operation):
    key = f"ipo-sync:{name}"
    if not cache.add(key, "running", timeout=900):
        return {"status": "LOCKED", "provider": name}
    try:
        return operation()
    except Exception as exc:
        # A source failure must never prevent the other providers from running.
        return {"status": "ERROR", "provider": name, "error": type(exc).__name__}
    finally:
        cache.delete(key)


@shared_task(name="ipos.tasks.sync_sebi_filings")
def sync_sebi_filings():
    def run():
        state, _ = IPOProviderSyncState.objects.get_or_create(source_key="sebi")
        if not state.enabled:
            return {"status": "DISABLED", "provider": "sebi"}
        state.last_attempt_at = timezone.now()
        state.last_status = "RUNNING"
        state.save(update_fields=["last_attempt_at", "last_status"])
        try:
            created, total = sync_sebi_index()
        except Exception as exc:
            state.last_status = "ERROR"
            state.last_safe_error = type(exc).__name__
            state.save(update_fields=["last_status", "last_safe_error"])
            raise
        state.last_status = "OK"
        state.last_safe_error = ""
        state.last_success_at = timezone.now()
        state.fetched_count = total
        state.updated_count = total
        state.save(
            update_fields=[
                "last_status",
                "last_safe_error",
                "last_success_at",
                "fetched_count",
                "updated_count",
            ]
        )
        return {"status": "OK", "provider": "sebi", "new": created, "fetched": total}

    return _locked("sebi", run)


def _sync_nse(*, refresh_discovery: bool) -> dict:
    state, _ = IPOProviderSyncState.objects.get_or_create(source_key="nse")
    if not state.enabled:
        return {"status": "DISABLED", "provider": "nse"}
    rights = os.environ.get("LOTNEETI_NSE_SOURCE_RIGHTS_REFERENCE", "").strip()
    directory = os.environ.get("LOTNEETI_IPO_SOURCE_CACHE_DIR", "").strip()
    if not rights or not directory:
        return {
            "status": "CONFIGURATION_REQUIRED",
            "provider": "nse",
            "reason": "Founder source-use reference and private source cache are required",
        }
    state.last_attempt_at = timezone.now()
    state.last_status = "RUNNING"
    state.save(update_fields=["last_attempt_at", "last_status"])
    output = StringIO()
    try:
        call_command(
            "enrich_live_ipos",
            saved_dir=directory,
            fetch=True,
            refresh_discovery=refresh_discovery,
            publish_local=False,
            rights_reference=rights,
            stdout=output,
        )
        from ipos.feed_watch import current_feed_issues

        issues = current_feed_issues()
        from ipos.local_publication import publish_enriched_issue

        changed = 0
        publication_review = 0
        for issue in issues:
            if issue["enrichment_state"] != "READY":
                continue
            try:
                _, was_changed = publish_enriched_issue(issue, rights_reference=rights)
                changed += int(was_changed)
            except (ValidationError, ValueError):
                publication_review += 1
    except Exception as exc:
        state.last_status = "ERROR"
        state.last_safe_error = type(exc).__name__
        state.save(update_fields=["last_status", "last_safe_error"])
        return {"status": "ERROR", "provider": "nse", "error": type(exc).__name__}
    state.last_status = "OK"
    state.last_safe_error = ""
    state.last_success_at = timezone.now()
    state.fetched_count = len(issues)
    state.updated_count = changed
    state.save(
        update_fields=[
            "last_status",
            "last_safe_error",
            "last_success_at",
            "fetched_count",
            "updated_count",
        ]
    )
    return {
        "status": "OK",
        "provider": "nse",
        "discovered": len(issues),
        "ready": sum(item["enrichment_state"] == "READY" for item in issues),
        "changed": changed,
        "publication_review": publication_review,
    }


def run_ipo_sync(*, provider: str = "all") -> dict:
    """Use the same bounded pipeline for beat, Founder Admin, and CLI."""

    if provider not in {"all", "nse", "bse", "documents", "sebi"}:
        raise ValueError("Unsupported provider")
    results = {}
    if provider in {"all", "nse", "documents"}:
        results["nse"] = _sync_nse(refresh_discovery=provider != "documents")
    if provider in {"all", "bse"}:
        results["bse"] = {
            "status": "PERMISSION_REQUIRED",
            "reason": (
                "No permitted automatic BSE IPO discovery feed is configured; "
                "saved official imports remain available"
            ),
        }
    if provider in {"all", "sebi", "documents"}:
        results["sebi"] = sync_sebi_filings()
    return results


@shared_task(name="ipos.tasks.sync_daily_ipo_data")
def sync_daily_ipo_data():
    return _locked("daily", lambda: run_ipo_sync(provider="all"))


@shared_task(name="ipos.tasks.sync_official_ipo_sources")
def sync_official_ipo_sources():
    return sync_daily_ipo_data()


@shared_task(name="ipos.tasks.sync_gmp_sources")
def sync_gmp_sources():
    if not IPO.objects.filter(
        publication_state=IPO.PublicationState.PUBLISHED,
        status__in=[IPO.Status.OPEN, IPO.Status.UPCOMING],
    ).exists():
        return {"status": "NO_RELEVANT_IPOS", "requested": 0}
    return {
        "status": "PERMISSION_REQUIRED",
        "reason": "No free GMP key and 15-minute redistribution entitlement are configured",
        "requested": 0,
    }


@shared_task(name="ipos.tasks.detect_stale_data")
def detect_stale_data():
    from ipos.models import SEBIFiling

    latest = SEBIFiling.objects.order_by("-fetched_at").first()
    return {
        "sebi_stale": latest is None
        or (timezone.now() - latest.fetched_at).total_seconds() >= 21600
    }
