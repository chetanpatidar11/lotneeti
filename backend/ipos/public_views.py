from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
        disabled = GMPProviderState.objects.filter(enabled=False).values("provider_key")
        observations = (
            GMPObservation.objects.filter(ipo=ipo)
            .exclude(source_key__in=disabled)
            .select_related("ipo")
        )
        return Response(GMPHistorySerializer(observations, many=True).data)
