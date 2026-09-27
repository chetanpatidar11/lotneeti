import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class IPO(models.Model):
    class IssueType(models.TextChoices):
        MAINBOARD = "MAINBOARD", "Mainboard"
        SME = "SME", "SME"

    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"
        ALLOTMENT = "ALLOTMENT", "Allotment"
        LISTED = "LISTED", "Listed"
        CANCELLED = "CANCELLED", "Cancelled"

    class PublicationState(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED = "ARCHIVED", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issuer_name = models.CharField(max_length=200)
    symbol = models.CharField(max_length=40, blank=True)
    issue_type = models.CharField(max_length=9, choices=IssueType.choices)
    lower_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    upper_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    lot_size = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    open_date = models.DateField()
    close_date = models.DateField()
    allotment_date = models.DateField()
    listing_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=9, choices=Status.choices, default=Status.UPCOMING)
    publication_state = models.CharField(
        max_length=9, choices=PublicationState.choices, default=PublicationState.DRAFT
    )
    source_key = models.CharField(max_length=80)
    source_record_id = models.CharField(max_length=160)
    source_url = models.URLField(blank=True)
    source_observed_at = models.DateTimeField(default=timezone.now)
    source_payload_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source_key", "source_record_id"], name="unique_ipo_source_record"
            )
        ]

    def __str__(self):
        return self.issuer_name

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def clean(self):
        errors = {}
        if self.lower_price is not None and self.upper_price is not None:
            if self.lower_price > self.upper_price:
                errors["upper_price"] = "Upper price must be at least the lower price."
        if self.open_date and self.close_date and self.open_date > self.close_date:
            errors["close_date"] = "Closing date cannot be before opening date."
        if self.close_date and self.allotment_date and self.close_date > self.allotment_date:
            errors["allotment_date"] = "Allotment date cannot be before closing date."
        if self.allotment_date and self.listing_date and self.allotment_date > self.listing_date:
            errors["listing_date"] = "Listing date cannot be before allotment date."
        if errors:
            raise ValidationError(errors)


class GMPObservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ipo = models.ForeignKey(IPO, on_delete=models.PROTECT, related_name="gmp_observations")
    source_key = models.CharField(max_length=80)
    value_per_share = models.DecimalField(max_digits=10, decimal_places=2)
    observed_at = models.DateTimeField()
    fetched_at = models.DateTimeField(default=timezone.now)
    source_url = models.URLField(blank=True)
    source_record_id = models.CharField(max_length=160, blank=True)
    source_payload_hash = models.CharField(max_length=64, blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        ordering = ["-observed_at", "-fetched_at", "-id"]

    def __str__(self):
        return f"{self.ipo.issuer_name}: {self.value_per_share} ({self.source_key})"

    def save(self, *args, **kwargs):
        if self._state.adding is False:
            raise ValueError("GMP history cannot be changed")
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("GMP history cannot be deleted")

    def clean(self):
        if self.observed_at is not None and timezone.is_naive(self.observed_at):
            raise ValidationError({"observed_at": "Observation time must have a timezone."})


class IPOUserDecision(models.Model):
    class Decision(models.TextChoices):
        DEFAULT = "DEFAULT", "Automatic"
        APPLY = "APPLY", "Apply"
        SKIP = "SKIP", "Skip"

    class Mode(models.TextChoices):
        RETAIL_ONLY = "RETAIL_ONLY", "Retail Only"
        RETAIL_PLUS_SHNI = "RETAIL_PLUS_SHNI", "Retail + sHNI"
        SHNI_PREFERRED = "SHNI_PREFERRED", "sHNI Preferred"
        CUSTOM = "CUSTOM", "Custom"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        "accounts.Workspace", on_delete=models.CASCADE, related_name="ipo_decisions"
    )
    ipo = models.ForeignKey(IPO, on_delete=models.CASCADE, related_name="workspace_decisions")
    decision = models.CharField(max_length=7, choices=Decision.choices, default=Decision.DEFAULT)
    mode = models.CharField(max_length=16, choices=Mode.choices, default=Mode.RETAIL_ONLY)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "ipo"], name="unique_workspace_ipo_decision"
            )
        ]

    def __str__(self):
        return f"{self.workspace.name}: {self.ipo.issuer_name} {self.decision}"
