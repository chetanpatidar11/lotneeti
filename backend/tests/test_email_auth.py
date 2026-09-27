from datetime import timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import EmailLoginToken, User
from core.models import AuditEvent


def token_from_email():
    link = mail.outbox[-1].body.splitlines()[-1]
    return parse_qs(urlparse(link).query)["token"][0]


@pytest.mark.django_db
def test_email_link_creates_user_and_persistent_session_once():
    client = APIClient()
    start = client.post(reverse("email-login-start"), {"email": "New@Example.Test"})

    assert start.status_code == 200
    assert len(mail.outbox) == 1
    assert User.objects.count() == 0
    token = token_from_email()
    assert token not in EmailLoginToken.objects.get().token_hash

    verify = client.post(reverse("email-login-verify"), {"token": token})

    assert verify.status_code == 200
    assert verify.data["email"] == "new@example.test"
    assert AuditEvent.objects.get(action="auth.email_login").actor.email == "new@example.test"
    assert client.get(reverse("me")).status_code == 200
    assert client.session.get_expiry_age() > 29 * 24 * 60 * 60
    assert client.post(reverse("email-login-verify"), {"token": token}).status_code == 400
    assert client.post(reverse("logout")).status_code == 204
    assert client.get(reverse("me")).status_code == 403


@pytest.mark.django_db
def test_expired_link_cannot_sign_in():
    client = APIClient()
    client.post(reverse("email-login-start"), {"email": "person@example.test"})
    token = token_from_email()
    EmailLoginToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

    assert client.post(reverse("email-login-verify"), {"token": token}).status_code == 400
    assert User.objects.count() == 0


@pytest.mark.django_db
def test_repeat_request_is_throttled_and_founder_link_is_not_sent():
    client = APIClient()
    start = reverse("email-login-start")
    client.post(start, {"email": "person@example.test"})
    client.post(start, {"email": "person@example.test"})
    assert len(mail.outbox) == 1

    User.objects.create_superuser(email="founder@example.test", password="test-password")
    response = client.post(start, {"email": "founder@example.test"})
    assert response.status_code == 200
    assert len(mail.outbox) == 1
