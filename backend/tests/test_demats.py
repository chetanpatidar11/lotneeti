import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User, WorkspaceMembership
from accounts.services import create_workspace
from investors.models import DematAccount, Investor


@pytest.mark.django_db
def test_demat_create_edit_and_masked_identifiers():
    owner = User.objects.create_user(email="owner@example.test")
    workspace = create_workspace(name="Family", owner=owner)
    investor = Investor(workspace=workspace, name="Synthetic")
    investor.set_pan("TESTX0001A")
    investor.save()
    client = APIClient()
    client.force_authenticate(owner)
    list_url = reverse("demat-list", args=[workspace.pk, investor.pk])

    response = client.post(
        list_url,
        {
            "depository": "CDSL",
            "dp_id": "DEMO-DP-0001",
            "client_id": "DEMO-CLIENT-0002",
            "broker": "Demo Broker",
        },
    )

    assert response.status_code == 201
    assert response.data["dp_id_masked"] == "••••0001"
    assert response.data["client_id_masked"] == "••••0002"
    assert "dp_id" not in response.data
    demat = DematAccount.objects.get(pk=response.data["id"])
    assert "DEMO-DP-0001" not in demat.dp_id_ciphertext
    assert "DEMO-CLIENT-0002" not in demat.client_id_ciphertext

    detail_url = reverse("demat-detail", args=[workspace.pk, investor.pk, demat.pk])
    updated = client.patch(detail_url, {"active": False, "depository": "NSDL"})
    assert updated.status_code == 200
    assert updated.data["active"] is False
    assert updated.data["depository"] == "NSDL"


@pytest.mark.django_db
def test_demat_workspace_scope_and_viewer_write_denial():
    owner = User.objects.create_user(email="owner@example.test")
    viewer = User.objects.create_user(email="viewer@example.test")
    outsider = User.objects.create_user(email="outsider@example.test")
    workspace = create_workspace(name="Family", owner=owner)
    WorkspaceMembership.objects.create(
        workspace=workspace, user=viewer, role=WorkspaceMembership.Role.VIEWER
    )
    investor = Investor(workspace=workspace, name="Synthetic")
    investor.set_pan("TESTX0001A")
    investor.save()
    demat = DematAccount(investor=investor, depository="CDSL")
    demat.set_dp_id("DEMO-DP-0001")
    demat.set_client_id("DEMO-CLIENT-0002")
    demat.save()
    detail_url = reverse("demat-detail", args=[workspace.pk, investor.pk, demat.pk])
    client = APIClient()

    client.force_authenticate(outsider)
    assert client.get(detail_url).status_code == 403

    client.force_authenticate(viewer)
    assert client.get(detail_url).status_code == 200
    assert client.patch(detail_url, {"active": False}).status_code == 403
