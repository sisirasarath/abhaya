"""URL routing for ABHAYA Portal API."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    PublicOverviewAPIView,
    PublicHelplinesAPIView,
    PublicCategoriesAPIView,
    StudentRegisterAPIView,
    StudentLoginAPIView,
    AdminLoginAPIView,
    LogoutAPIView,
    CurrentUserAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
    ChangePasswordAPIView,
    StudentDashboardAPIView,
    StudentProfileAPIView,
    StudentComplaintListCreateAPIView,
    StudentComplaintDetailAPIView,
    StudentComplaintRespondAPIView,
    NotificationsAPIView,
    AdminDashboardAPIView,
    AdminComplaintListAPIView,
    AdminComplaintDetailAPIView,
    AdminComplaintStatusUpdateAPIView,
    AdminComplaintAssignAPIView,
    AdminStudentListAPIView,
    AdminStudentVerifyActionAPIView,
    AdminRosterListCreateAPIView,
    AdminHelplineListCreateAPIView,
    AdminHelplineDetailAPIView,
    AdminManagementListCreateAPIView,
    AdminManagementDetailAPIView,
    AdminReportsAnalyticsAPIView,
    AdminPortalSettingsAPIView,
)

urlpatterns = [
    # Public Endpoints (No Login Required)
    path('public/overview/', PublicOverviewAPIView.as_view(), name='public-overview'),
    path('public/helplines/', PublicHelplinesAPIView.as_view(), name='public-helplines'),
    path('public/categories/', PublicCategoriesAPIView.as_view(), name='public-categories'),

    # Authentication & Verification
    path('auth/student/register/', StudentRegisterAPIView.as_view(), name='student-register'),
    path('auth/student/login/', StudentLoginAPIView.as_view(), name='student-login'),
    path('auth/admin/login/', AdminLoginAPIView.as_view(), name='admin-login'),
    path('auth/logout/', LogoutAPIView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserAPIView.as_view(), name='auth-me'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),
    path('auth/password-reset/request/', ForgotPasswordAPIView.as_view(), name='password-reset-request-alias'),
    path('auth/password-reset/confirm/', ResetPasswordAPIView.as_view(), name='password-reset-confirm-alias'),
    path('auth/change-password/', ChangePasswordAPIView.as_view(), name='change-password'),

    # Student Portal Endpoints (Approved Female Students Only)
    path('student/dashboard/', StudentDashboardAPIView.as_view(), name='student-dashboard'),
    path('student/profile/', StudentProfileAPIView.as_view(), name='student-profile'),
    path('student/complaints/', StudentComplaintListCreateAPIView.as_view(), name='student-complaints'),
    path('student/complaints/<str:complaint_id>/', StudentComplaintDetailAPIView.as_view(), name='student-complaint-detail'),
    path('student/complaints/<str:complaint_id>/respond/', StudentComplaintRespondAPIView.as_view(), name='student-complaint-respond'),
    path('notifications/', NotificationsAPIView.as_view(), name='portal-notifications'),

    # Administrator Portal Endpoints (Role-Based Access Control)
    path('admin/dashboard/', AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('admin/complaints/', AdminComplaintListAPIView.as_view(), name='admin-complaints'),
    path('admin/complaints/<str:complaint_id>/', AdminComplaintDetailAPIView.as_view(), name='admin-complaint-detail'),
    path('admin/complaints/<str:complaint_id>/update-status/', AdminComplaintStatusUpdateAPIView.as_view(), name='admin-complaint-status'),
    path('admin/complaints/<str:complaint_id>/assign/', AdminComplaintAssignAPIView.as_view(), name='admin-complaint-assign'),
    path('admin/students/', AdminStudentListAPIView.as_view(), name='admin-students'),
    path('admin/students/<int:student_id>/verify/', AdminStudentVerifyActionAPIView.as_view(), name='admin-student-verify'),
    path('admin/verifications/', AdminStudentListAPIView.as_view(), name='admin-verifications-alias'),
    path('admin/verifications/<int:student_id>/action/', AdminStudentVerifyActionAPIView.as_view(), name='admin-verifications-action-alias'),
    path('admin/roster/', AdminRosterListCreateAPIView.as_view(), name='admin-roster'),
    path('admin/helplines/', AdminHelplineListCreateAPIView.as_view(), name='admin-helplines'),
    path('admin/helplines/<int:pk>/', AdminHelplineDetailAPIView.as_view(), name='admin-helpline-detail'),
    path('admin/administrators/', AdminManagementListCreateAPIView.as_view(), name='admin-administrators'),
    path('admin/administrators/<int:pk>/', AdminManagementDetailAPIView.as_view(), name='admin-administrator-detail'),
    path('admin/reports/', AdminReportsAnalyticsAPIView.as_view(), name='admin-reports'),
    path('admin/settings/', AdminPortalSettingsAPIView.as_view(), name='admin-settings'),
]

