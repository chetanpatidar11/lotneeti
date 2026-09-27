from django.urls import path

from investors.views import DematAccountViewSet, InvestorViewSet

investor_list = InvestorViewSet.as_view({"get": "list", "post": "create"})
investor_detail = InvestorViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update"}
)
demat_list = DematAccountViewSet.as_view({"get": "list", "post": "create"})
demat_detail = DematAccountViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update"}
)

urlpatterns = [
    path("workspaces/<uuid:workspace_id>/investors/", investor_list, name="investor-list"),
    path(
        "workspaces/<uuid:workspace_id>/investors/<uuid:pk>/",
        investor_detail,
        name="investor-detail",
    ),
    path(
        "workspaces/<uuid:workspace_id>/investors/<uuid:investor_id>/demats/",
        demat_list,
        name="demat-list",
    ),
    path(
        "workspaces/<uuid:workspace_id>/investors/<uuid:investor_id>/demats/<uuid:pk>/",
        demat_detail,
        name="demat-detail",
    ),
]
