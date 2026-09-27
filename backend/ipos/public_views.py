from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ipos.gmp_effective import resolve_gmp
from ipos.gmp_policy import current_gmp_policy
from ipos.models import GMPObservation, GMPProviderState
from ipos.overrides import published_ipos
from ipos.public_serializers import GMPHistorySerializer, PublicIPOSerializer


class PublicIPOViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PublicIPOSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return published_ipos().order_by("open_date", "id")


class GMPHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ipo_id):
        ipo = get_object_or_404(published_ipos(), pk=ipo_id)
        now = timezone.now()
        resolution = resolve_gmp(ipo, at=now)
        policy = current_gmp_policy()
        observations = GMPObservation.objects.filter(ipo=ipo).select_related("ipo")
        states = dict(GMPProviderState.objects.values_list("provider_key", "enabled"))
        return Response(
            GMPHistorySerializer(
                observations,
                many=True,
                context={
                    "states": states,
                    "fresh_ids": {item.pk for item in resolution.fresh_observations},
                    "now": now,
                    "freshness_hours": policy.freshness_hours,
                },
            ).data
        )
