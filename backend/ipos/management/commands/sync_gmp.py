from django.core.management.base import BaseCommand

from ipos.tasks import sync_gmp_sources


class Command(BaseCommand):
    help = "Run the permissioned daily GMP source synchronization"

    def handle(self, *args, **options):
        result = sync_gmp_sources()
        detail = result.get("reason") or result.get("error") or ""
        self.stdout.write(f"GMP: {result['status']}{f' — {detail}' if detail else ''}")
