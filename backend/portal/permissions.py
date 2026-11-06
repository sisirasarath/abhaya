"""
Role-based access control (RBAC) and student verification permission classes for ABHAYA.
"""
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


class IsApprovedStudent(BasePermission):
    """
    Allows access ONLY to authenticated female students whose registration status is APPROVED.
    Pending, Rejected, or Suspended accounts are strictly blocked at the backend API layer.
    """
    message = 'Access restricted to verified and approved female students only.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role != 'STUDENT':
            raise PermissionDenied('This section is exclusively for verified female students.')
        student = getattr(user, 'student_profile', None)
        if not student:
            raise PermissionDenied('Student profile not found.')
        if student.verification_status == 'PENDING':
            raise PermissionDenied(
                'Your registration is currently PENDING VERIFICATION by the college administrator. '
                'You will gain access once your student eligibility is approved.'
            )
        if student.verification_status == 'REJECTED':
            raise PermissionDenied(
                'Your student registration could not be verified and was marked as REJECTED. '
                'Please contact the College Women\'s Cell for assistance.'
            )
        if student.verification_status == 'SUSPENDED':
            raise PermissionDenied('Your student account has been suspended by the administrator.')
        return student.verification_status == 'APPROVED' and user.is_active


class IsPortalAdmin(BasePermission):
    """
    Allows access ONLY to authenticated active administrators.
    """
    message = 'Administrator authorization required.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role != 'ADMIN':
            return False
        admin_profile = getattr(user, 'admin_profile', None)
        if not admin_profile or not admin_profile.is_active_admin:
            return False
        return user.is_active


class IsSuperAdmin(BasePermission):
    """
    Allows access ONLY to Super Administrators.
    """
    message = 'Super Administrator privileges required for this action.'

    def has_permission(self, request, view):
        if not IsPortalAdmin().has_permission(request, view):
            return False
        return request.user.admin_profile.admin_role == 'SUPER_ADMIN'


def filter_complaints_for_admin(queryset, admin_profile):
    """
    Scopes complaint queryset according to the Administrator's role:
    - SUPER_ADMIN: All complaints across the portal.
    - WOMENS_CELL_ADMIN: Personal Safety, College-Related, Emergency/Urgent, Hostel harassment,
      or complaints assigned to Women's Cell / ICC.
    - HOSTEL_ADMIN: Hostel-Related complaints or complaints assigned to Hostel Warden.
    - COMPLAINT_HANDLER: Complaints explicitly assigned to them or their authority unit.
    """
    from django.db.models import Q

    role = admin_profile.admin_role
    if role == 'SUPER_ADMIN':
        return queryset
    if role == 'WOMENS_CELL_ADMIN':
        return queryset.filter(
            Q(category_code__in=['PERSONAL_SAFETY', 'COLLEGE_ISSUES', 'EMERGENCY_URGENT'])
            | Q(subcategory__icontains='Harassment')
            | Q(assigned_authority__in=["Women's Cell", 'Internal Complaints Committee'])
            | Q(assigned_handler=admin_profile)
        ).distinct()
    if role == 'HOSTEL_ADMIN':
        return queryset.filter(
            Q(category_code='HOSTEL')
            | Q(assigned_authority='Hostel Warden')
            | Q(assigned_handler=admin_profile)
        ).distinct()
    # COMPLAINT_HANDLER
    return queryset.filter(
        Q(assigned_handler=admin_profile)
        | Q(assigned_authority=admin_profile.assigned_authority_group)
    ).distinct()


def can_admin_view_student_identity(complaint, admin_profile):
    """
    Determines whether a specific administrator is authorized to see identifiable student details
    on a complaint in the backend serializer.
    - If the student selected DISCLOSED, the authorized handling authority / admin can view identity.
    - If the student selected CONFIDENTIAL, ONLY SUPER_ADMIN, WOMENS_CELL_ADMIN, or an admin
      with explicit `can_view_confidential_identity=True` can view identifiable information.
    """
    if complaint.confidentiality_preference == 'DISCLOSED':
        return True
    if not admin_profile:
        return False
    if admin_profile.admin_role in ('SUPER_ADMIN', 'WOMENS_CELL_ADMIN'):
        return True
    if admin_profile.can_view_confidential_identity:
        return True
    return False

