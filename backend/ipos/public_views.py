from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ipos.models import IPO, GMPObservation
from ipos.public_serializers import GMPHistorySerializer, PublicIPOSerializer


class PublicIPOViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PublicIPOSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return IPO.objects.filter(publication_state=IPO.PublicationState.PUBLISHED).order_by(
            "open_date", "id"
        )


class GMPHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ipo_id):
        ipo = get_object_or_404(
            IPO.objects.filter(publication_state=IPO.PublicationState.PUBLISHED), pk=ipo_id
        )
        observations = GMPObservation.objects.filter(ipo=ipo).select_related("ipo")
        return Response(GMPHistorySerializer(observations, many=True).data)
