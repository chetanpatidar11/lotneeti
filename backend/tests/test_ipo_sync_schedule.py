from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.conf import settings

from ipos.models import IPO, GMPObservation
from ipos.tasks import _sync_nse, run_ipo_sync, sync_gmp_sources


def test_only_one_daily_master_schedule_and_one_gmp_schedule():
    schedule = settings.CELERY_BEAT_SCHEDULE
    assert schedule["sync-daily-ipo-data"]["task"] == "ipos.tasks.sync_daily_ipo_data"
    assert str(schedule["sync-daily-ipo-data"]["schedule"]) == "<crontab: 0 0 * * * (m/h/dM/MY/d)>"
    assert schedule["sync-gmp"]["task"] == "ipos.tasks.sync_gmp_sources"
    assert str(schedule["sync-gmp"]["schedule"]) == "<crontab: 0 9 * * * (m/h/dM/MY/d)>"
    assert "refresh-ipo-provider-health" not in schedule
    assert "sync-sebi-filings" not in schedule


@pytest.mark.django_db
def test_daily_sources_are_isolated_when_nse_is_not_configured(monkeypatch):
    monkeypatch.delenv("LOTNEETI_NSE_SOURCE_RIGHTS_REFERENCE", raising=False)
    monkeypatch.delenv("LOTNEETI_IPO_SOURCE_CACHE_DIR", raising=False)
    with patch("ipos.tasks.sync_sebi_filings", return_value={"status": "OK", "fetched": 2}):
        first = run_ipo_sync()
        second = run_ipo_sync()
    assert first == second
    assert first["nse"]["status"] == "CONFIGURATION_REQUIRED"
    assert first["bse"]["status"] == "PERMISSION_REQUIRED"
    assert first["sebi"]["status"] == "OK"


@pytest.mark.django_db
def test_gmp_sync_exits_without_relevant_ipo():
    assert sync_gmp_sources() == {
        "status": "NO_RELEVANT_IPOS",
        "provider": "investorgain",
        "requested": 0,
    }


def make_gmp_ipo(name="Orient Cables (India) Limited"):
    today = date.today()
    return IPO.objects.create(
        issuer_name=name,
        issue_type=IPO.IssueType.MAINBOARD,
        lower_price=Decimal("250.00"),
        upper_price=Decimal("272.00"),
        lot_size=55,
        open_date=today,
        close_date=today + timedelta(days=2),
        allotment_date=today + timedelta(days=5),
        status=IPO.Status.OPEN,
        publication_state=IPO.PublicationState.PUBLISHED,
        source_key="synthetic",
        source_record_id=f"synthetic-{name}",
    )


@pytest.mark.django_db
def test_daily_investorgain_sync_stores_an_observation_and_is_idempotent():
    make_gmp_ipo()
    payload = {
        "reportTableData": [
            {
                "~id": 321,
                "~ipo_name": "Orient Cables",
                "GMP": "&#8377;<b>76</b> (27.94%)",
                "Updated-On": "28-Sep 23:37",
                "~urlrewrite_folder_name": "/gmp/orient-cables-ipo/321/",
            }
        ]
    }
    with patch(
        "ipos.investorgain_gmp.fetch_payload",
        return_value=("https://webnodejs.investorgain.com/example", payload),
    ):
        first = sync_gmp_sources()
        second = sync_gmp_sources()
    assert first["status"] == "OK"
    assert first["requested"] == first["matched"] == first["created"] == 1
    assert second["created"] == 0
    observation = GMPObservation.objects.get(source_key="investorgain")
    assert observation.value_per_share == Decimal("76")
    assert observation.source_record_id == "321"
    assert observation.source_url == "https://www.investorgain.com/gmp/orient-cables-ipo/321/"


@pytest.mark.django_db
def test_investorgain_skips_missing_gmp_instead_of_storing_zero():
    make_gmp_ipo("No GMP Limited")
    payload = {
        "reportTableData": [{"~id": 123, "~ipo_name": "No GMP", "GMP": "&#8377;<b>--</b> (0.00%)"}]
    }
    with patch(
        "ipos.investorgain_gmp.fetch_payload",
        return_value=("https://webnodejs.investorgain.com/example", payload),
    ):
        result = sync_gmp_sources()
    assert result["matched"] == result["created"] == 0
    assert GMPObservation.objects.filter(source_key="investorgain").count() == 0


@pytest.mark.django_db
def test_daily_nse_pipeline_publishes_ready_issue_idempotently(monkeypatch, tmp_path):
    monkeypatch.setenv("LOTNEETI_NSE_SOURCE_RIGHTS_REFERENCE", "synthetic-rights-reference")
    monkeypatch.setenv("LOTNEETI_IPO_SOURCE_CACHE_DIR", str(tmp_path))
    ready = {
        "symbol": "SYNTH",
        "issuer_name": "Synthetic Limited",
        "issue_type": "MAINBOARD",
        "source_market": "NSE_MAINBOARD",
        "listing_exchanges": "NSE",
        "designated_exchange": "NSE",
        "lower_price": "100.00",
        "upper_price": "110.00",
        "lot_size": 100,
        "open_date": "2026-09-28",
        "close_date": "2026-09-30",
        "allotment_date": "2026-10-01",
        "status": "Active",
        "source_observed_at": "2026-09-28T00:00:00+00:00",
        "source_record_id": "EQ:SYNTH",
        "field_sources": {"lot_size": "NSE_DETAIL", "allotment_date": "NSE_RHP"},
        "enrichment_state": "READY",
        "missing_planning_fields": [],
    }
    with (
        patch("ipos.tasks.call_command"),
        patch("ipos.feed_watch.current_feed_issues", return_value=[ready]),
    ):
        first = _sync_nse(refresh_discovery=True)
        second = _sync_nse(refresh_discovery=True)
    assert first["status"] == second["status"] == "OK"
    assert first["changed"] == 1
    assert second["changed"] == 0
    assert IPO.objects.filter(symbol="SYNTH").count() == 1
