from django.contrib import admin
from django.contrib.admin import AdminSite, ModelAdmin
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect

from accounts.models import User, Workspace, WorkspaceMembership
from core.audit import record_event
from core.models import AuditEvent
from platform_admin.totp import verify_admin_code


class FounderAdminSite(AdminSite):
    site_header = "LotNeeti staff"
    site_title = "LotNeeti staff"
    index_title = "Platform overview"

    def has_permission(self, request):
        user = request.user
        return (
            user.is_active
            and user.is_staff
            and user.is_founder_admin
            and request.session.get("admin_mfa_verified", False)
        )

    @method_decorator(csrf_protect)
    @method_decorator(never_cache)
    def login(self, request, extra_context=None):
        if self.has_permission(request):
            return HttpResponseRedirect(reverse("founder_admin:index"))

        error = False
        if request.method == "POST":
            email = request.POST.get("email", "").strip().lower()
            password = request.POST.get("password", "")
            code = request.POST.get("code", "")
            user = authenticate(request, username=email, password=password)
            if (
                user is not None
                and user.is_staff
                and user.is_founder_admin
                and verify_admin_code(user, code)
            ):
                login(request, user)
                request.session["admin_mfa_verified"] = True
                request.session.set_expiry(8 * 60 * 60)
                record_event(
                    action="admin.login",
                    target=user,
                    actor=user,
                    metadata={"method": "PASSWORD_TOTP"},
                )
                return HttpResponseRedirect(reverse("founder_admin:index"))
            error = True

        return render(request, "platform_admin/login.html", {"error": error})


founder_admin_site = FounderAdminSite(name="founder_admin")


class ReadOnlyModelAdmin(ModelAdmin):
    def has_view_permission(self, request, obj=None):
        return founder_admin_site.has_permission(request)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(User, site=founder_admin_site)
class UserAdmin(ReadOnlyModelAdmin):
    list_display = ("email", "is_active", "is_staff", "is_founder_admin")
    search_fields = ("email",)


@admin.register(Workspace, site=founder_admin_site)
class WorkspaceAdmin(ReadOnlyModelAdmin):
    list_display = ("name", "owner", "created_at")
    search_fields = ("name", "owner__email")


@admin.register(WorkspaceMembership, site=founder_admin_site)
class WorkspaceMembershipAdmin(ReadOnlyModelAdmin):
    list_display = ("workspace", "user", "role", "created_at")
    search_fields = ("workspace__name", "user__email")


@admin.register(AuditEvent, site=founder_admin_site)
class AuditEventAdmin(ReadOnlyModelAdmin):
    list_display = ("created_at", "action", "actor", "workspace", "object_type", "object_id")
    list_filter = ("action", "created_at")
