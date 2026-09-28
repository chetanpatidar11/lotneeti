from django.core.management.base import BaseCommand

from ipos.tasks import sync_gmp_sources


class Command(BaseCommand):
    help = "Report permission status for automatic GMP sources"

    def handle(self, *args, **options):
        result = sync_gmp_sources()
        self.stdout.write(f"GMP: {result['status']} — {result['reason']}")
