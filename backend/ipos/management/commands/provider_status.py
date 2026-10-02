from django.core.management.base import BaseCommand
from django.utils import timezone

from ipos.models import IPO, GMPObservation, IPOFeedBatch, IPOProviderSyncState, SEBIFiling


def _local_time(value):
    return timezone.localtime(value).isoformat() if value else "never"


class Command(BaseCommand):
    help = "Show concise local live-data provider status"

    def handle(self, *args, **options):
        latest = SEBIFiling.objects.order_by("-fetched_at").first()
        sebi_state = IPOProviderSyncState.objects.filter(source_key="sebi").first()
        nse_state = IPOProviderSyncState.objects.filter(source_key="nse").first()
        gmp_state = IPOProviderSyncState.objects.filter(source_key="investorgain").first()
        self.stdout.write("NSE: licensed slots 00:01 and hourly 09:00–19:00 Asia/Kolkata")
        if nse_state:
            self.stdout.write(
                f"NSE sync: status {nse_state.last_status or 'never'}; "
                f"last attempt {_local_time(nse_state.last_attempt_at)}; "
                f"last success {_local_time(nse_state.last_success_at)}; "
                f"safe error {nse_state.last_safe_error or 'none'}"
            )
        self.stdout.write(
            f"NSE watch: {IPOFeedBatch.objects.filter(source_key='nse').count()} saved batches"
        )
        self.stdout.write("BSE: REGISTRATION/LICENSE REQUIRED; IPO feed schema unverified")
        last_sync = timezone.localtime(latest.fetched_at).isoformat() if latest else "never"
        self.stdout.write(f"SEBI: {SEBIFiling.objects.count()} filing links; last sync {last_sync}")
        if sebi_state:
            self.stdout.write(
                f"SEBI sync: {'enabled' if sebi_state.enabled else 'disabled'}; "
                f"status {sebi_state.last_status or 'never'}; "
                f"last attempt {sebi_state.last_attempt_at or 'never'}; "
                f"safe error {sebi_state.last_safe_error or 'none'}"
            )
        self.stdout.write(
            f"GMP: {GMPObservation.objects.count()} observations; "
            "licensed InvestorGain slots 00:01 and hourly 09:00–19:00 Asia/Kolkata"
        )
        if gmp_state:
            self.stdout.write(
                f"InvestorGain sync: status {gmp_state.last_status or 'never'}; "
                f"last attempt {_local_time(gmp_state.last_attempt_at)}; "
                f"last success {_local_time(gmp_state.last_success_at)}; "
                f"safe error {gmp_state.last_safe_error or 'none'}"
            )
        self.stdout.write(
            f"Published canonical IPOs: {IPO.objects.filter(publication_state='PUBLISHED').count()}"
        )
