from urllib.parse import parse_qs, urlparse

import pyotp
import pytest
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from accounts.services import create_workspace
from core.models import AuditEvent
from platform_admin.models import AdminTOTPDevice
from platform_admin.totp import enroll_admin, verify_admin_code


def secret_from_uri(uri):
    return parse_qs(urlparse(uri).query)["secret"][0]


@pytest.mark.django_db
def test_founder_admin_can_access_separate_platform_controls():
    founder = User.objects.create_superuser(email="founder@example.test", password="test-password")
    create_workspace(name="Founder's workspace", owner=founder)
    uri = enroll_admin(founder)
    site = Client()
    login_response = site.post(
        reverse("founder_admin:login"),
        {
            "email": founder.email,
            "password": "test-password",
            "code": pyotp.TOTP(secret_from_uri(uri)).now(),
        },
    )

    assert login_response.status_code == 302
    assert AuditEvent.objects.filter(action="admin.login", actor=founder).count() == 1
    assert site.get(reverse("platform-overview")).json() == {"users": 1, "workspaces": 1}
    assert site.get(reverse("founder_admin:index")).status_code == 200


@pytest.mark.django_db
def test_workspace_owner_does_not_gain_platform_access_even_if_staff():
    owner = User.objects.create_user(email="owner@example.test", is_staff=True)
    create_workspace(name="Owner workspace", owner=owner)
    api = APIClient()
    api.force_authenticate(owner)
    site = Client()
    site.force_login(owner)

    assert api.get(reverse("platform-overview")).status_code == 403
    assert site.get(reverse("founder_admin:index")).status_code == 302


@pytest.mark.django_db
def test_founder_flag_without_staff_status_is_not_enough():
    user = User.objects.create_user(email="flagged@example.test", is_founder_admin=True)
    api = APIClient()
    api.force_authenticate(user)

    assert api.get(reverse("platform-overview")).status_code == 403


@pytest.mark.django_db
def test_founder_password_without_valid_totp_cannot_enter_staff_site():
    founder = User.objects.create_superuser(email="founder@example.test", password="test-password")
    enroll_admin(founder)
    site = Client()
    login_url = reverse("founder_admin:login")

    assert (
        site.post(login_url, {"email": founder.email, "password": "test-password"}).status_code
        == 200
    )
    assert (
        site.post(
            login_url, {"email": founder.email, "password": "test-password", "code": "000000"}
        ).status_code
        == 200
    )
    assert site.get(reverse("founder_admin:index")).status_code == 302
    assert site.get(reverse("platform-overview")).status_code == 403


@pytest.mark.django_db
def test_totp_secret_is_encrypted_and_code_cannot_be_replayed():
    founder = User.objects.create_superuser(email="founder@example.test", password="test-password")
    uri = enroll_admin(founder)
    secret = secret_from_uri(uri)
    device = AdminTOTPDevice.objects.get(user=founder)
    code = pyotp.TOTP(secret).now()

    assert secret not in device.secret_ciphertext
    assert verify_admin_code(founder, code)
    assert not verify_admin_code(founder, code)


@pytest.mark.django_db
def test_staff_login_requires_csrf_token():
    founder = User.objects.create_superuser(email="founder@example.test", password="test-password")
    uri = enroll_admin(founder)
    site = Client(enforce_csrf_checks=True)
    login_url = reverse("founder_admin:login")

    assert site.post(login_url, {}).status_code == 403
    assert site.get(login_url).status_code == 200
    response = site.post(
        login_url,
        {
            "email": founder.email,
            "password": "test-password",
            "code": pyotp.TOTP(secret_from_uri(uri)).now(),
            "csrfmiddlewaretoken": site.cookies["csrftoken"].value,
        },
    )
    assert response.status_code == 302
