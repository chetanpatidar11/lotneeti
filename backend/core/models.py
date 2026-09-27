from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    workspace = models.ForeignKey(
        "accounts.Workspace", null=True, blank=True, on_delete=models.SET_NULL
    )
    object_type = models.CharField(max_length=120)
    object_id = models.CharField(max_length=64)
    action = models.CharField(max_length=100)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.action} ({self.object_type}:{self.object_id})"

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValueError("Audit events cannot be changed")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit events cannot be deleted")
