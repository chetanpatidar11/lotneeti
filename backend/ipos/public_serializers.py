from decimal import Decimal

from rest_framework import serializers

from ipos.content import published_summary
from ipos.gmp_effective import effective_observation_value, latest_effective_gmp
from ipos.models import IPO, GMPObservation
from ipos.overrides import OVERRIDABLE_FIELDS, effective_ipo_values


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
        value = effective_observation_value(obj)
        return str(gmp_percent(value, effective_ipo_values(obj.ipo)["upper_price"]))

    def to_representation(self, instance):
        result = super().to_representation(instance)
        result["value_per_share"] = str(effective_observation_value(instance))
        return result


class PublicIPOSerializer(serializers.ModelSerializer):
    current_gmp = serializers.SerializerMethodField()
    current_gmp_percent = serializers.SerializerMethodField()
    current_gmp_observed_at = serializers.SerializerMethodField()
    company_summary = serializers.SerializerMethodField()
    financial_summary = serializers.SerializerMethodField()
    risk_summary = serializers.SerializerMethodField()

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
            "company_summary",
            "financial_summary",
            "risk_summary",
        )

    def get_company_summary(self, obj):
        return published_summary(obj, "COMPANY")

    def get_financial_summary(self, obj):
        return published_summary(obj, "FINANCIAL")

    def get_risk_summary(self, obj):
        return published_summary(obj, "RISK")

    def to_representation(self, instance):
        result = super().to_representation(instance)
        effective = effective_ipo_values(instance)
        for name in OVERRIDABLE_FIELDS.intersection(result):
            result[name] = self.fields[name].to_representation(effective[name])
        return result

    def _latest(self, obj):
        if hasattr(obj, "_latest_gmp"):
            return obj._latest_gmp
        obj._latest_gmp = latest_effective_gmp(obj)
        return obj._latest_gmp

    def get_current_gmp(self, obj):
        latest = self._latest(obj)
        return str(latest.value_per_share) if latest else None

    def get_current_gmp_percent(self, obj):
        latest = self._latest(obj)
        upper = effective_ipo_values(obj)["upper_price"]
        return str(gmp_percent(latest.value_per_share, upper)) if latest else None

    def get_current_gmp_observed_at(self, obj):
        latest = self._latest(obj)
        return latest.observed_at.isoformat() if latest else None
