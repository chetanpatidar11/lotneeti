"""Manual IPO source used in the founder beta."""

import hashlib
import json
import uuid
from collections.abc import Mapping
from datetime import datetime
from decimal import Decimal

from django.utils import timezone

from ipos.dto import IPORecord
from ipos.models import IPO, GMPObservation


class ManualIPOProvider:
    key = "manual"

    def normalize(
        self, raw: Mapping[str, object], *, source_record_id: str, observed_at: datetime
    ) -> IPORecord:
        return IPORecord.from_mapping(
            raw,
            source_key=self.key,
            source_record_id=source_record_id,
            observed_at=observed_at,
        )

    def create(self, fields: dict) -> IPO:
        record = self.normalize(
            fields, source_record_id=str(uuid.uuid4()), observed_at=timezone.now()
        )
        ipo = IPO(**record.model_fields())
        ipo.save()
        return ipo

    def update(self, ipo: IPO, fields: dict) -> IPO:
        if ipo.source_key != self.key:
            raise ValueError("Only manual IPO records can be edited by this provider")
        raw = {
            field: getattr(ipo, field)
            for field in (
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
                "publication_state",
                "source_url",
            )
        }
        raw.update(fields)
        record = self.normalize(
            raw, source_record_id=ipo.source_record_id, observed_at=timezone.now()
        )
        for field, value in record.model_fields().items():
            setattr(ipo, field, value)
        ipo.save()
        return ipo


class ManualGMPProvider:
    key = "manual"

    def record(
        self,
        *,
        ipo: IPO,
        value_per_share: Decimal,
        observed_at: datetime,
        source_url: str = "",
        recorded_by=None,
    ) -> GMPObservation:
        payload = {
            "ipo_id": str(ipo.pk),
            "value_per_share": str(value_per_share),
            "observed_at": observed_at.isoformat(),
            "source_url": source_url,
        }
        encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        observation = GMPObservation(
            ipo=ipo,
            source_key=self.key,
            source_record_id=str(uuid.uuid4()),
            value_per_share=value_per_share,
            observed_at=observed_at,
            source_url=source_url,
            source_payload_hash=hashlib.sha256(encoded).hexdigest(),
            recorded_by=recorded_by,
        )
        observation.save()
        return observation
