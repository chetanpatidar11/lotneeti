from django.core.management.base import BaseCommand
from django.utils import timezone

from ipos.models import IPO, GMPObservation, IPOFeedBatch, IPOProviderSyncState, SEBIFiling


class Command(BaseCommand):
    help = "Show concise local live-data provider status"

    def handle(self, *args, **options):
        latest = SEBIFiling.objects.order_by("-fetched_at").first()
        sebi_state = IPOProviderSyncState.objects.filter(source_key="sebi").first()
        self.stdout.write("NSE: OFFLINE IMPORT ONLY; website automation prohibited")
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
            "external automatic sources need permission"
        )
        self.stdout.write(
            f"Published canonical IPOs: {IPO.objects.filter(publication_state='PUBLISHED').count()}"
        )
