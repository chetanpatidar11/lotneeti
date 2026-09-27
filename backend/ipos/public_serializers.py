from decimal import Decimal

from rest_framework import serializers

from ipos.models import IPO, GMPObservation


def gmp_percent(value: Decimal, upper_price: Decimal) -> Decimal:
    return (value * Decimal("100") / upper_price).quantize(Decimal("0.01"))


class GMPHistorySerializer(serializers.ModelSerializer):
    percent = serializers.SerializerMethodField()

    class Meta:
        model = GMPObservation
        fields = (
            "id",
            "value_per_share",
            "percent",
            "observed_at",
            "fetched_at",
            "source_key",
            "source_url",
        )

    def get_percent(self, obj):
        return str(gmp_percent(obj.value_per_share, obj.ipo.upper_price))


class PublicIPOSerializer(serializers.ModelSerializer):
    current_gmp = serializers.SerializerMethodField()
    current_gmp_percent = serializers.SerializerMethodField()
    current_gmp_observed_at = serializers.SerializerMethodField()

    class Meta:
        model = IPO
        fields = (
            "id",
            "issuer_name",
            "symbol",
            "issue_type",
            "lower_price",
            "upper_price",
            "lot_size",
            "open_date",
            "close_date",
            "allotment_date",
            "listing_date",
            "status",
            "current_gmp",
            "current_gmp_percent",
            "current_gmp_observed_at",
        )

    def _latest(self, obj):
        if hasattr(obj, "_latest_gmp"):
            return obj._latest_gmp
        obj._latest_gmp = obj.gmp_observations.first()
        return obj._latest_gmp

    def get_current_gmp(self, obj):
        latest = self._latest(obj)
        return str(latest.value_per_share) if latest else None

    def get_current_gmp_percent(self, obj):
        latest = self._latest(obj)
        return str(gmp_percent(latest.value_per_share, obj.upper_price)) if latest else None

    def get_current_gmp_observed_at(self, obj):
        latest = self._latest(obj)
        return latest.observed_at.isoformat() if latest else None
