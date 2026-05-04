from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Platform staff/superuser only."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwner(permissions.BasePermission):
    """Object must have a .user field matching the requesting user."""

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsGroupCreator(permissions.BasePermission):
    """Requesting user must be the creator of the group goal."""

    def has_object_permission(self, request, view, obj):
        from apps.goals.models import GroupParticipant
        return GroupParticipant.objects.filter(
            goal=obj, user=request.user, is_creator=True
        ).exists()


class IsGroupMember(permissions.BasePermission):
    """Requesting user must be a participant in the group goal."""

    def has_object_permission(self, request, view, obj):
        from apps.goals.models import GroupParticipant
        return GroupParticipant.objects.filter(
            goal=obj, user=request.user
        ).exists()


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user
