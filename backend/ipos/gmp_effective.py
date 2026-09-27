"""Resolve the effective GMP value while retaining immutable source history."""

from dataclasses import dataclass

from django.utils import timezone

from ipos.models import GMPObservation, GMPProviderState
from ipos.provider_health import active_provider_override


@dataclass(frozen=True)
class EffectiveGMP:
    observation: GMPObservation
    value_per_share: object

    @property
    def observed_at(self):
        return self.observation.observed_at

    @property
    def fetched_at(self):
        return self.observation.fetched_at

    @property
    def source_key(self):
        return self.observation.source_key

    @property
    def source_url(self):
        return self.observation.source_url


def effective_observation_value(observation: GMPObservation, *, at=None):
    now = at or timezone.now()
    correction = (
        observation.overrides.filter(resumed_at__isnull=True, expires_at__gt=now)
        .order_by("-created_at", "-id")
        .first()
    )
    if correction is not None:
        return correction.value_per_share
    state = GMPProviderState.objects.filter(provider_key=observation.source_key).first()
    if state is not None:
        override = active_provider_override(state, at=now)
        if override is not None:
            return override
    return observation.value_per_share


def latest_effective_gmp(ipo, *, at=None):
    disabled = GMPProviderState.objects.filter(enabled=False).values("provider_key")
    for observation in ipo.gmp_observations.exclude(source_key__in=disabled):
        return EffectiveGMP(
            observation=observation,
            value_per_share=effective_observation_value(observation, at=at),
        )
    return None
