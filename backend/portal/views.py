"""
API Views for ABHAYA – Women's Safety and Support Portal.
"""
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    PortalUser,
    EligibleStudentRoster,
    Student,
    Administrator,
    StudentVerification,
    ComplaintCategory,
    Complaint,
    ComplaintAssignment,
    ComplaintUpdate,
    ComplaintAttachment,
    EmergencyContact,
    Notification,
    AuditLog,
    PortalSetting,
)
from .permissions import (
    IsApprovedStudent,
    IsPortalAdmin,
    IsSuperAdmin,
    filter_complaints_for_admin,
    can_admin_view_student_identity,
)
from .serializers import (
    EmergencyContactSerializer,
    PortalSettingSerializer,
    StudentRegistrationSerializer,
    StudentProfileSerializer,
    StudentVerificationAdminSerializer,
    AdministratorSerializer,
    AdminCreateSerializer,
    ComplaintCategorySerializer,
    ComplaintStudentListSerializer,
    ComplaintStudentDetailSerializer,
    ComplaintAdminListSerializer,
    ComplaintAdminDetailSerializer,
    ComplaintCreateSerializer,
    NotificationSerializer,
    AuditLogSerializer,
    validate_uploaded_file,
)


def get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def log_admin_action(request, action, target_type, target_id, details):
    user = request.user if request and request.user and request.user.is_authenticated else None
    actor_email = user.email if user else 'system@abhaya.local'
    actor_role = user.role if user else 'SYSTEM'
    if user and user.role == 'ADMIN' and hasattr(user, 'admin_profile'):
        actor_role = user.admin_profile.get_admin_role_display()
    AuditLog.objects.create(
        actor=user,
        actor_email=actor_email,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=details,
        ip_address=get_client_ip(request) if request else '127.0.0.1',
    )


def dispatch_portal_email(recipient_email, subject, body):
    """Dispatches email via configured Django EMAIL_BACKEND if enabled in PortalSetting."""
    setting = PortalSetting.objects.first()
    if setting and not setting.enable_email_notifications:
        return False
    try:
        send_mail(
            subject=f"[ABHAYA Portal] {subject}",
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'abhaya-noreply@college.edu.in'),
            recipient_list=[recipient_email],
            fail_silently=True,
        )
        return True
    except Exception:
        return False


def set_jwt_cookies(response, access_token, refresh_token):
    access_cookie = getattr(settings, 'JWT_ACCESS_COOKIE_NAME', 'abhaya_access_token')
    refresh_cookie = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'abhaya_refresh_token')
    secure = getattr(settings, 'JWT_COOKIE_SECURE', False)
    samesite = getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax')

    response.set_cookie(
        access_cookie,
        access_token,
        max_age=int(getattr(settings, 'ACCESS_TOKEN_MINUTES', 120)) * 60,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/',
    )
    response.set_cookie(
        refresh_cookie,
        refresh_token,
        max_age=int(getattr(settings, 'REFRESH_TOKEN_DAYS', 7)) * 86400,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/',
    )
    return response


def clear_jwt_cookies(response):
    access_cookie = getattr(settings, 'JWT_ACCESS_COOKIE_NAME', 'abhaya_access_token')
    refresh_cookie = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'abhaya_refresh_token')
    response.delete_cookie(access_cookie, path='/')
    response.delete_cookie(refresh_cookie, path='/')
    return response


# ============================================================================
# 1. PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED)
# ============================================================================

class PublicOverviewAPIView(APIView):
    """
    Returns public configuration, emergency helplines, and official complaint categories.
    Never exposes student accounts or complaint records publicly.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        portal_setting, _ = PortalSetting.objects.get_or_create(id=1)
        helplines = EmergencyContact.objects.filter(is_active=True).order_by('display_order', '-is_featured', 'service_name')
        categories = ComplaintCategory.objects.filter(is_active=True).order_by('display_order')
        return Response({
            'portal_settings': PortalSettingSerializer(portal_setting).data,
            'helplines': EmergencyContactSerializer(helplines, many=True).data,
            'categories': ComplaintCategorySerializer(categories, many=True).data,
        })


class PublicHelplinesAPIView(APIView):
    """
    Publicly accessible Emergency Helplines endpoint.
    Accessible without creating an account or logging in.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = EmergencyContact.objects.filter(is_active=True)
        category = request.query_params.get('category', '').strip()
        featured = request.query_params.get('featured', '').strip().lower()
        search = request.query_params.get('search', '').strip()

        if category and category != 'ALL':
            qs = qs.filter(category=category)
        if featured in ('true', '1', 'yes'):
            qs = qs.filter(is_featured=True)
        if search:
            qs = qs.filter(
                Q(service_name__icontains=search)
                | Q(description__icontains=search)
                | Q(contact_number__icontains=search)
            )
        qs = qs.order_by('display_order', '-is_featured', 'service_name')
        return Response({
            'count': qs.count(),
            'results': EmergencyContactSerializer(qs, many=True).data,
        })


class PublicCategoriesAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = ComplaintCategory.objects.filter(is_active=True).order_by('display_order')
        return Response(ComplaintCategorySerializer(categories, many=True).data)


# ============================================================================
# 2. AUTHENTICATION & VERIFICATION ENDPOINTS
# ============================================================================

class StudentRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        dispatch_portal_email(
            student.email,
            'Registration Completed – Welcome to ABHAYA',
            (
                f"Dear {student.full_name},\n\n"
                f"Your female student account on ABHAYA (Admission No: {student.admission_number}) has been created and activated.\n"
                f"You can now sign in to the student portal immediately."
            ),
        )

        return Response(
            {
                'message': 'Your ABHAYA female student account has been created and activated! You may now sign in immediately.',
                'verification_status': student.verification_status,
                'student': StudentProfileSerializer(student).data,
            },
            status=status.HTTP_201_CREATED,
        )


class StudentLoginAPIView(APIView):
    """
    Authenticates female students by email or admission number.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = (request.data.get('email') or '').strip()
        password = request.data.get('password') or ''

        if not identifier or not password:
            return Response(
                {'error': 'Please provide both registered email (or admission number) and password.', 'message': 'Please provide both registered email (or admission number) and password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_obj = PortalUser.objects.filter(email__iexact=identifier).first()
        if not user_obj:
            student_by_adm = Student.objects.filter(admission_number__iexact=identifier).select_related('user').first()
            if student_by_adm:
                user_obj = student_by_adm.user

        if not user_obj or not user_obj.check_password(password):
            return Response(
                {'error': 'Invalid email/admission number or password.', 'message': 'Invalid email/admission number or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user_obj.role != 'STUDENT':
            return Response(
                {
                    'error': 'This login is exclusively for female students. Administrators must use the Admin Login page.',
                    'message': 'This login is exclusively for female students. Administrators must use the Admin Login page.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        student = getattr(user_obj, 'student_profile', None)
        if not student:
            return Response(
                {'error': 'Student profile record not found.', 'message': 'Student profile record not found.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If a newly registered student is still in PENDING state, approve automatically on sign-in
        if student.verification_status == 'PENDING':
            student.verification_status = 'APPROVED'
            student.save(update_fields=['verification_status', 'updated_at'])

        if student.verification_status == 'REJECTED':
            ver = getattr(student, 'verification_record', None)
            reason = ver.rejection_reason if ver and ver.rejection_reason else 'Eligibility could not be verified.'
            msg = (
                f"Your registration request was not approved ({reason}). "
                "Please contact the College Women's Cell with your college ID card for verification."
            )
            return Response(
                {
                    'error': msg,
                    'verification_status': 'REJECTED',
                    'account_status': 'REJECTED',
                    'message': msg,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if student.verification_status == 'SUSPENDED' or not user_obj.is_active:
            msg = 'Your student account is currently suspended. Please contact the administrator.'
            return Response(
                {
                    'error': msg,
                    'verification_status': 'SUSPENDED',
                    'account_status': 'SUSPENDED',
                    'message': msg,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user_obj)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        unread_count = Notification.objects.filter(recipient=user_obj, is_read=False).count()
        response = Response({
            'message': f"Welcome back, {student.full_name}.",
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': user_obj.id,
                'email': user_obj.email,
                'full_name': student.full_name,
                'role': 'STUDENT',
                'unread_notifications': unread_count,
                'student_profile': StudentProfileSerializer(student).data,
            },
        })
        return set_jwt_cookies(response, access_token, refresh_token)


class AdminLoginAPIView(APIView):
    """
    Single unified secure login endpoint for the ABHAYA Administrator Portal.
    Authenticates via administrator username (default: abhayasfi) and password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = (
            request.data.get('username')
            or request.data.get('email')
            or ''
        ).strip()
        password = request.data.get('password') or ''

        if not identifier or not password:
            return Response(
                {'error': 'Please enter administrator username and password.', 'message': 'Please enter administrator username and password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lookup = identifier.lower()
        candidate_emails = [lookup]
        if '@' not in lookup:
            candidate_emails.append(f"{lookup}@abhaya.edu.in")

        email_query = Q(email__iexact=lookup) | Q(full_name__iexact=identifier)
        for cand in candidate_emails:
            email_query |= Q(email__iexact=cand)
        if '@' not in lookup:
            email_query |= Q(email__istartswith=f"{lookup}@")

        user_obj = (
            PortalUser.objects.filter(role='ADMIN', is_active=True)
            .filter(email_query)
            .order_by('-is_superuser', 'id')
            .first()
        )

        if not user_obj or not user_obj.check_password(password):
            return Response(
                {'error': 'Invalid administrator username or password.', 'message': 'Invalid administrator username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user_obj.role != 'ADMIN':
            return Response(
                {
                    'error': 'Access denied. Student accounts cannot access the Administrator Dashboard.',
                    'message': 'Access denied. Student accounts cannot access the Administrator Dashboard.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        admin_profile = getattr(user_obj, 'admin_profile', None)
        if not admin_profile or not admin_profile.is_active_admin or not user_obj.is_active:
            return Response(
                {'error': 'This administrator account is inactive or disabled.', 'message': 'This administrator account is inactive or disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user_obj)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        AuditLog.objects.create(
            actor=user_obj,
            actor_email=user_obj.email,
            actor_role=admin_profile.get_admin_role_display(),
            action='ADMIN_LOGIN',
            target_type='Administrator',
            target_id=str(admin_profile.id),
            details=f"Administrator {admin_profile.full_name} ({user_obj.email}) signed in.",
            ip_address=get_client_ip(request),
        )

        unread_count = Notification.objects.filter(recipient=user_obj, is_read=False).count()
        admin_username = user_obj.email.split('@')[0] if '@' in user_obj.email else user_obj.email
        response = Response({
            'message': f"Authenticated as {admin_profile.full_name}.",
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': user_obj.id,
                'username': admin_username,
                'email': user_obj.email,
                'full_name': admin_profile.full_name,
                'role': 'ADMIN',
                'admin_role': admin_profile.get_admin_role_display(),
                'unread_notifications': unread_count,
                'admin_profile': AdministratorSerializer(admin_profile).data,
            },
        })
        return set_jwt_cookies(response, access_token, refresh_token)


class LogoutAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh') or request.COOKIES.get(
            getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'abhaya_refresh_token')
        )
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        response = Response({'message': 'Logged out securely.'})
        return clear_jwt_cookies(response)


class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        unread_count = Notification.objects.filter(recipient=user, is_read=False).count()
        if user.role == 'STUDENT':
            student = getattr(user, 'student_profile', None)
            if not student or student.verification_status != 'APPROVED':
                return Response(
                    {'error': True, 'message': 'Student account is not in Approved status.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response({
                'id': user.id,
                'email': user.email,
                'full_name': student.full_name,
                'role': 'STUDENT',
                'unread_notifications': unread_count,
                'student_profile': StudentProfileSerializer(student).data,
            })
        elif user.role == 'ADMIN':
            admin_profile = getattr(user, 'admin_profile', None)
            if not admin_profile or not admin_profile.is_active_admin:
                return Response(
                    {'error': True, 'message': 'Administrator account is inactive.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response({
                'id': user.id,
                'email': user.email,
                'full_name': admin_profile.full_name,
                'role': 'ADMIN',
                'unread_notifications': unread_count,
                'admin_profile': AdministratorSerializer(admin_profile).data,
            })
        return Response({'error': True, 'message': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').lower().strip()
        if not email:
            return Response(
                {'error': True, 'message': 'Please enter your registered email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = PortalUser.objects.filter(email=email).first()
        if not user:
            # Return generic message for security while indicating status
            return Response({
                'message': 'If an account matches this email, a password reset code has been generated.',
            })

        token = f"ABH-RST-{secrets.token_hex(3).upper()}"
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timedelta(minutes=30)
        user.save(update_fields=['password_reset_token', 'password_reset_expires'])

        dispatch_portal_email(
            user.email,
            'Password Reset Verification Code',
            f"Your ABHAYA password reset verification code is: {token} (valid for 30 minutes).",
        )

        return Response({
            'message': 'Password reset verification code generated and dispatched via configured email service.',
            'reset_code_preview': token,
            'reset_token_preview': token,
        })


class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').lower().strip()
        token = (request.data.get('token') or '').strip()
        new_password = request.data.get('new_password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        if not email or not token or not new_password:
            return Response(
                {'error': True, 'message': 'Email, verification token, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_password != confirm_password:
            return Response(
                {'error': True, 'message': 'New password and confirmation do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {'error': True, 'message': 'Password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = PortalUser.objects.filter(email=email, password_reset_token=token).first()
        if not user or not user.password_reset_expires or user.password_reset_expires < timezone.now():
            return Response(
                {'error': True, 'message': 'Invalid or expired password reset verification code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()

        return Response({'message': 'Your password has been reset successfully. You may now sign in.'})


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        if not request.user.check_password(current_password):
            return Response(
                {'error': True, 'message': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_password != confirm_password:
            return Response(
                {'error': True, 'message': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {'error': True, 'message': 'New password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Password updated successfully.'})


# ============================================================================
# 3. STUDENT PORTAL ENDPOINTS (VERIFIED & APPROVED FEMALE STUDENTS ONLY)
# ============================================================================

class StudentDashboardAPIView(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        student = request.user.student_profile
        complaints_qs = Complaint.objects.filter(student=student).select_related('category')

        total = complaints_qs.count()
        submitted = complaints_qs.filter(status='SUBMITTED').count()
        under_review = complaints_qs.filter(status='UNDER_REVIEW').count()
        in_progress = complaints_qs.filter(status__in=['ASSIGNED', 'ACTION_IN_PROGRESS']).count()
        resolved = complaints_qs.filter(status__in=['RESOLVED', 'CLOSED']).count()

        recent_complaints = complaints_qs.order_by('-created_at')[:6]
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:5]
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()

        return Response({
            'student': StudentProfileSerializer(student).data,
            'summary': {
                'total_complaints': total,
                'pending_submitted': submitted,
                'under_review_active': under_review + in_progress,
                'resolved_closed': resolved,
            },
            'statistics': {
                'total_complaints': total,
                'submitted': submitted,
                'under_review': under_review,
                'in_progress': in_progress,
                'resolved': resolved,
            },
            'recent_complaints': ComplaintStudentListSerializer(recent_complaints, many=True).data,
            'recent_notifications': NotificationSerializer(notifications, many=True).data,
            'unread_notifications_count': unread_count,
        })


class StudentProfileAPIView(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(StudentProfileSerializer(request.user.student_profile).data)

    def patch(self, request):
        student = request.user.student_profile
        allowed_fields = ['full_name', 'phone_number', 'department', 'year_semester', 'residence_type', 'hostel_name']
        for field in allowed_fields:
            if field in request.data:
                setattr(student, field, request.data[field])
        if student.residence_type == 'DAY_SCHOLAR':
            student.hostel_name = 'Day Scholar'
        student.save()
        if request.user.full_name != student.full_name:
            request.user.full_name = student.full_name
            request.user.save(update_fields=['full_name'])
        return Response({
            'message': 'Profile updated successfully.',
            'student': StudentProfileSerializer(student).data,
        })


class StudentComplaintListCreateAPIView(APIView):
    """
    Lists complaints belonging ONLY to the authenticated approved student,
    and allows submitting new complaints with optional attachments.
    """
    permission_classes = [IsApprovedStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        student = request.user.student_profile
        qs = Complaint.objects.filter(student=student).select_related('category')

        status_filter = request.query_params.get('status', '').strip()
        category_filter = request.query_params.get('category', '').strip()
        search = request.query_params.get('search', '').strip()

        if status_filter and status_filter != 'ALL':
            qs = qs.filter(status=status_filter)
        if category_filter and category_filter != 'ALL':
            qs = qs.filter(category_code=category_filter)
        if search:
            qs = qs.filter(
                Q(complaint_id__icontains=search)
                | Q(title__icontains=search)
                | Q(subcategory__icontains=search)
                | Q(incident_location__icontains=search)
            )

        qs = qs.order_by('-created_at')
        return Response({
            'count': qs.count(),
            'results': ComplaintStudentListSerializer(qs, many=True).data,
        })

    def post(self, request):
        serializer = ComplaintCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()

        dispatch_portal_email(
            request.user.email,
            f"Complaint Submitted – ID {complaint.complaint_id}",
            (
                f"Dear {request.user.full_name},\n\n"
                f"Your complaint '{complaint.title}' has been registered on ABHAYA.\n"
                f"Complaint ID: {complaint.complaint_id}\n"
                f"Category: {complaint.category.name} ({complaint.subcategory})\n"
                f"Assigned Authority: {complaint.assigned_authority}\n"
                f"Status: {complaint.get_status_display()}"
            ),
        )

        return Response(
            {
                'message': f"Your complaint has been securely registered with ID {complaint.complaint_id}.",
                'complaint_id': complaint.complaint_id,
                'complaint': ComplaintStudentDetailSerializer(complaint, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class StudentComplaintDetailAPIView(APIView):
    """
    Retrieves a single complaint for the authenticated student.
    Strictly enforces ownership: a student can NEVER access another student's complaint.
    """
    permission_classes = [IsApprovedStudent]

    def get(self, request, complaint_id):
        complaint = get_object_or_404(
            Complaint.objects.select_related('category', 'assigned_handler'),
            complaint_id=complaint_id,
        )
        if complaint.student.user_id != request.user.id:
            return Response(
                {
                    'error': True,
                    'message': 'Access denied. Students are strictly permitted to view only their own complaints.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(ComplaintStudentDetailSerializer(complaint, context={'request': request}).data)


class StudentComplaintRespondAPIView(APIView):
    """
    Allows a student to add follow-up information and/or supporting documents
    to their existing complaint when it is not Closed.
    """
    permission_classes = [IsApprovedStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic
    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        if complaint.student.user_id != request.user.id:
            return Response(
                {'error': True, 'message': 'Access denied. You can only update your own complaints.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if complaint.status == 'CLOSED':
            return Response(
                {'error': True, 'message': 'This complaint is closed and cannot receive further updates.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = (request.data.get('message') or '').strip()
        files = request.FILES.getlist('attachments')
        if not message and not files:
            return Response(
                {'error': True, 'message': 'Please provide additional details or attach a supporting file.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for f in files[:5]:
            validate_uploaded_file(f)
            ComplaintAttachment.objects.create(
                complaint=complaint,
                uploaded_by=request.user,
                file=f,
                original_filename=f.name,
                content_type=getattr(f, 'content_type', 'application/octet-stream'),
                file_size=f.size,
            )

        update_msg = message or f"Attached {len(files)} supporting document(s)."
        ComplaintUpdate.objects.create(
            complaint=complaint,
            author_user=request.user,
            author_role='STUDENT',
            author_display_name=complaint.student.full_name,
            update_type='STUDENT_RESPONSE',
            previous_status=complaint.status,
            new_status=complaint.status,
            message=update_msg,
            is_internal=False,
        )
        complaint.updated_at = timezone.now()
        complaint.save(update_fields=['updated_at'])

        if complaint.assigned_handler:
            Notification.objects.create(
                recipient=complaint.assigned_handler.user,
                complaint=complaint,
                notification_type='INFO_REQUESTED',
                title=f"Student Follow-Up Added on {complaint.complaint_id}",
                message=f"The student added additional information on complaint {complaint.complaint_id}.",
            )

        return Response({
            'message': 'Your additional information has been added to the complaint timeline.',
            'complaint': ComplaintStudentDetailSerializer(complaint, context={'request': request}).data,
        })


class NotificationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:50]
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({
            'unread_count': unread_count,
            'results': NotificationSerializer(qs, many=True).data,
        })

    def post(self, request):
        notif_id = request.data.get('notification_id')
        if notif_id:
            Notification.objects.filter(recipient=request.user, id=notif_id).update(is_read=True)
        else:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'message': 'Notifications marked as read.', 'unread_count': unread_count})


# ============================================================================
# 4. ADMINISTRATOR PORTAL ENDPOINTS (ROLE-BASED ACCESS CONTROL)
# ============================================================================

class AdminDashboardAPIView(APIView):
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        admin_profile = request.user.admin_profile
        scoped_complaints = filter_complaints_for_admin(Complaint.objects.all(), admin_profile)

        total_students = Student.objects.count()
        pending_students = Student.objects.filter(verification_status='PENDING').count()
        approved_students = Student.objects.filter(verification_status='APPROVED').count()
        rejected_students = Student.objects.filter(verification_status='REJECTED').count()

        total_complaints = scoped_complaints.count()
        new_complaints = scoped_complaints.filter(status='SUBMITTED').count()
        urgent_complaints = scoped_complaints.filter(
            Q(priority='URGENT') | Q(immediate_assistance_required=True),
            ~Q(status__in=['RESOLVED', 'CLOSED']),
        ).count()
        under_review = scoped_complaints.filter(status='UNDER_REVIEW').count()
        in_progress = scoped_complaints.filter(status__in=['ASSIGNED', 'ACTION_IN_PROGRESS']).count()
        resolved = scoped_complaints.filter(status__in=['RESOLVED', 'CLOSED']).count()

        # Chart 1: Complaints by Category
        cat_counts = (
            scoped_complaints.values('category__name', 'category_code')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        complaints_by_category = [
            {'name': item['category__name'] or item['category_code'], 'code': item['category_code'], 'count': item['count']}
            for item in cat_counts
        ]

        # Chart 2: Complaints by Status
        status_labels = dict(Complaint.STATUS_CHOICES)
        status_counts = (
            scoped_complaints.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        complaints_by_status = [
            {'status': status_labels.get(item['status'], item['status']), 'code': item['status'], 'count': item['count']}
            for item in status_counts
        ]

        # Chart 3: Monthly Complaint Trends (last 6 months)
        now = timezone.now()
        monthly_trends = []
        for i in range(5, -1, -1):
            month_date = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
            label = month_date.strftime('%b %Y')
            c = scoped_complaints.filter(
                created_at__year=month_date.year,
                created_at__month=month_date.month,
            ).count()
            r = scoped_complaints.filter(
                created_at__year=month_date.year,
                created_at__month=month_date.month,
                status__in=['RESOLVED', 'CLOSED'],
            ).count()
            monthly_trends.append({'month': label, 'submitted': c, 'resolved': r})

        # Chart 4: Hostel-related complaints breakdown
        hostel_counts = (
            scoped_complaints.filter(category_code='HOSTEL')
            .values('subcategory')
            .annotate(count=Count('id'))
            .order_by('-count')[:8]
        )
        hostel_breakdown = [{'subcategory': h['subcategory'], 'count': h['count']} for h in hostel_counts]

        # Chart 5: Department-wise complaints
        dept_counts = (
            scoped_complaints.values('student_department')
            .annotate(count=Count('id'))
            .order_by('-count')[:8]
        )
        department_breakdown = [
            {'department': d['student_department'] or 'Unspecified', 'count': d['count']}
            for d in dept_counts
        ]

        urgent_queue = scoped_complaints.filter(
            Q(priority__in=['URGENT', 'HIGH']) | Q(immediate_assistance_required=True)
        ).order_by('-created_at')[:6]

        recent_complaints_qs = scoped_complaints.order_by('-created_at')[:8]
        recent_audits = AuditLog.objects.all().order_by('-created_at')[:8]

        womens_cell_count = scoped_complaints.filter(
            category_code__in=['PERSONAL_SAFETY', 'COLLEGE_ISSUES']
        ).count()
        hostel_wing_count = scoped_complaints.filter(category_code='HOSTEL').count()
        urgent_wing_count = scoped_complaints.filter(
            Q(category_code='EMERGENCY_URGENT') | Q(priority='URGENT')
        ).count()
        active_handler_count = scoped_complaints.filter(
            status__in=['UNDER_REVIEW', 'ASSIGNED', 'ACTION_IN_PROGRESS']
        ).count()

        metrics_dict = {
            'total_registered_students': total_students,
            'pending_verifications': pending_students,
            'pending_registrations': pending_students,
            'approved_students': approved_students,
            'rejected_students': rejected_students,
            'total_complaints': total_complaints,
            'new_submitted': new_complaints,
            'new_complaints': new_complaints,
            'urgent_complaints': urgent_complaints,
            'under_review': under_review,
            'complaints_under_review': under_review,
            'complaints_in_progress': in_progress,
            'resolved_complaints': resolved,
            'womens_cell_count': womens_cell_count,
            'hostel_wing_count': hostel_wing_count,
            'urgent_wing_count': urgent_wing_count,
            'active_handler_count': active_handler_count,
        }

        return Response({
            'admin_profile': AdministratorSerializer(admin_profile).data,
            'metrics': metrics_dict,
            'statistics': metrics_dict,
            'by_category': complaints_by_category,
            'charts': {
                'complaints_by_category': complaints_by_category,
                'complaints_by_status': complaints_by_status,
                'monthly_complaint_trends': monthly_trends,
                'hostel_complaints': hostel_breakdown,
                'department_complaints': department_breakdown,
            },
            'recent_complaints': ComplaintAdminListSerializer(
                recent_complaints_qs, many=True, context={'request': request}
            ).data,
            'urgent_complaints_queue': ComplaintAdminListSerializer(
                urgent_queue, many=True, context={'request': request}
            ).data,
            'recent_audit_logs': AuditLogSerializer(recent_audits, many=True).data,
        })


class AdminComplaintListAPIView(APIView):
    """
    Lists complaints scoped by the Administrator's role with full filtering:
    category, status, priority, department, hostel, date range, and search.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        admin_profile = request.user.admin_profile
        qs = filter_complaints_for_admin(
            Complaint.objects.select_related('category', 'student', 'assigned_handler'),
            admin_profile,
        )

        category = request.query_params.get('category', '').strip()
        status_val = request.query_params.get('status', '').strip()
        priority = request.query_params.get('priority', '').strip()
        department = request.query_params.get('department', '').strip()
        hostel = request.query_params.get('hostel', '').strip()
        date_from = request.query_params.get('date_from', '').strip()
        date_to = request.query_params.get('date_to', '').strip()
        search = request.query_params.get('search', '').strip()

        if category and category != 'ALL':
            qs = qs.filter(category_code=category)
        if status_val and status_val != 'ALL':
            qs = qs.filter(status=status_val)
        if priority and priority != 'ALL':
            qs = qs.filter(priority=priority)
        if department and department != 'ALL':
            qs = qs.filter(student_department__icontains=department)
        if hostel and hostel != 'ALL':
            qs = qs.filter(student_hostel__icontains=hostel)
        if date_from:
            qs = qs.filter(incident_date__gte=date_from)
        if date_to:
            qs = qs.filter(incident_date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(complaint_id__icontains=search)
                | Q(title__icontains=search)
                | Q(subcategory__icontains=search)
                | Q(incident_location__icontains=search)
                | Q(assigned_authority__icontains=search)
            )

        qs = qs.order_by('-created_at')
        return Response({
            'count': qs.count(),
            'admin_role': admin_profile.admin_role,
            'admin_role_display': admin_profile.get_admin_role_display(),
            'results': ComplaintAdminListSerializer(qs, many=True, context={'request': request}).data,
        })


class AdminComplaintDetailAPIView(APIView):
    """
    Retrieves full complaint details for authorized administrators.
    Enforces role-based scope AND logs access to confidential complaints in AuditLog.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request, complaint_id):
        admin_profile = request.user.admin_profile
        scoped_qs = filter_complaints_for_admin(
            Complaint.objects.select_related('category', 'student', 'assigned_handler'),
            admin_profile,
        )
        complaint = scoped_qs.filter(complaint_id=complaint_id).first()
        if not complaint:
            return Response(
                {
                    'error': True,
                    'message': (
                        f"Access denied or complaint {complaint_id} not found within your role scope "
                        f"({admin_profile.get_admin_role_display()})."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if complaint.confidentiality_preference == 'CONFIDENTIAL' and can_admin_view_student_identity(
            complaint, admin_profile
        ):
            log_admin_action(
                request,
                action='CONFIDENTIAL_COMPLAINT_ACCESSED',
                target_type='Complaint',
                target_id=complaint.complaint_id,
                details=(
                    f"{admin_profile.full_name} ({admin_profile.get_admin_role_display()}) accessed confidential "
                    f"complaint {complaint.complaint_id}."
                ),
            )

        handlers = Administrator.objects.filter(is_active_admin=True).order_by('full_name')
        return Response({
            'complaint': ComplaintAdminDetailSerializer(complaint, context={'request': request}).data,
            'available_handlers': AdministratorSerializer(handlers, many=True).data,
        })


class AdminComplaintStatusUpdateAPIView(APIView):
    """
    Allows authorized administrators to:
    - Update complaint status (Submitted, Under Review, Assigned, Action in Progress, Resolved, Closed)
    - Update priority (Low, Medium, High, Urgent)
    - Add internal administrative notes (`is_internal=True` — hidden from students)
    - Add student-visible updates (`is_internal=False`)
    - Record resolution details
    """
    permission_classes = [IsPortalAdmin]

    @transaction.atomic
    def post(self, request, complaint_id):
        admin_profile = request.user.admin_profile
        scoped_qs = filter_complaints_for_admin(Complaint.objects.all(), admin_profile)
        complaint = scoped_qs.filter(complaint_id=complaint_id).first()
        if not complaint:
            return Response(
                {'error': True, 'message': 'You do not have permission to modify this complaint.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = (request.data.get('status') or complaint.status).strip()
        new_priority = (request.data.get('priority') or complaint.priority).strip()
        message = (request.data.get('message') or '').strip()
        is_internal = bool(request.data.get('is_internal', False))
        resolution_details = (request.data.get('resolution_details') or '').strip()

        valid_statuses = dict(Complaint.STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response(
                {'error': True, 'message': 'Invalid complaint status selected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_status = complaint.status
        status_changed = new_status != prev_status
        priority_changed = new_priority != complaint.priority

        complaint.status = new_status
        if new_priority in dict(Complaint.PRIORITY_CHOICES):
            complaint.priority = new_priority
        if resolution_details:
            complaint.resolution_details = resolution_details
        if new_status == 'RESOLVED' and not complaint.resolved_at:
            complaint.resolved_at = timezone.now()
        if new_status == 'CLOSED' and not complaint.closed_at:
            complaint.closed_at = timezone.now()
        complaint.save()

        if is_internal:
            update_type = 'INTERNAL_NOTE'
            note_text = message or f"Internal review note recorded by {admin_profile.full_name}."
        elif new_status == 'RESOLVED' and resolution_details:
            update_type = 'RESOLUTION'
            note_text = message or f"Complaint resolved: {resolution_details}"
        elif status_changed:
            update_type = 'STATUS_CHANGE'
            note_text = message or f"Status updated from {valid_statuses.get(prev_status)} to {valid_statuses.get(new_status)}."
        else:
            update_type = 'ADMIN_UPDATE'
            note_text = message or f"Administrative update posted by {admin_profile.full_name}."

        ComplaintUpdate.objects.create(
            complaint=complaint,
            author_user=request.user,
            author_role='ADMIN',
            author_display_name=f"{admin_profile.full_name} ({admin_profile.designation})",
            update_type=update_type,
            previous_status=prev_status,
            new_status=new_status,
            message=note_text,
            is_internal=is_internal,
        )

        # Notify student ONLY when the update is not strictly internal or when status changes
        if not is_internal or status_changed:
            student_msg = (
                note_text
                if not is_internal
                else f"Your complaint {complaint.complaint_id} status has been updated to {complaint.get_status_display()}."
            )
            notif_type = 'COMPLAINT_RESOLVED' if new_status == 'RESOLVED' else 'STATUS_UPDATED'
            Notification.objects.create(
                recipient=complaint.student.user,
                complaint=complaint,
                notification_type=notif_type,
                title=f"Update on Complaint {complaint.complaint_id}: {complaint.get_status_display()}",
                message=student_msg,
                email_sent=True,
            )
            dispatch_portal_email(
                complaint.student.email,
                f"Complaint {complaint.complaint_id} – {complaint.get_status_display()}",
                student_msg,
            )

        log_admin_action(
            request,
            action='COMPLAINT_UPDATED',
            target_type='Complaint',
            target_id=complaint.complaint_id,
            details=(
                f"Status: {prev_status} -> {new_status} | Priority: {complaint.priority} | "
                f"Internal Note: {is_internal} | Priority Changed: {priority_changed}"
            ),
        )

        return Response({
            'message': 'Complaint updated successfully.',
            'complaint': ComplaintAdminDetailSerializer(complaint, context={'request': request}).data,
        })


class AdminComplaintAssignAPIView(APIView):
    """
    Assigns a complaint to a designated authority (Women's Cell, ICC, Hostel Warden,
    College Administration, Other Authorized Support Personnel) and/or specific Administrator.
    """
    permission_classes = [IsPortalAdmin]

    @transaction.atomic
    def post(self, request, complaint_id):
        admin_profile = request.user.admin_profile
        scoped_qs = filter_complaints_for_admin(Complaint.objects.all(), admin_profile)
        complaint = scoped_qs.filter(complaint_id=complaint_id).first()
        if not complaint:
            return Response(
                {'error': True, 'message': 'You are not authorized to assign this complaint.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        authority = (
            request.data.get('assigned_to_authority')
            or request.data.get('assigned_authority')
            or ''
        ).strip()
        handler_id = request.data.get('assigned_to_admin_id')
        new_priority = (request.data.get('priority') or '').strip()
        assignment_note = (
            request.data.get('assignment_note')
            or request.data.get('note')
            or ''
        ).strip()

        if not authority:
            return Response(
                {'error': 'Please select a designated authority for assignment.', 'message': 'Please select a designated authority for assignment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_admin = None
        if handler_id:
            target_admin = Administrator.objects.filter(id=handler_id, is_active_admin=True).first()

        # Mark previous assignments inactive
        ComplaintAssignment.objects.filter(complaint=complaint, is_active=True).update(is_active=False)

        assignment = ComplaintAssignment.objects.create(
            complaint=complaint,
            assigned_to_authority=authority,
            assigned_to_admin=target_admin,
            assigned_by=admin_profile,
            assignment_note=assignment_note or f"Assigned to {authority} by {admin_profile.full_name}.",
            is_active=True,
        )

        prev_status = complaint.status
        if complaint.status in ('SUBMITTED', 'UNDER_REVIEW'):
            complaint.status = 'ASSIGNED'
        if new_priority in dict(Complaint.PRIORITY_CHOICES):
            complaint.priority = new_priority
        complaint.assigned_authority = authority
        complaint.assigned_handler = target_admin
        complaint.save()

        handler_label = f" ({target_admin.full_name})" if target_admin else ""
        ComplaintUpdate.objects.create(
            complaint=complaint,
            author_user=request.user,
            author_role='ADMIN',
            author_display_name=f"{admin_profile.full_name} ({admin_profile.designation})",
            update_type='ASSIGNMENT',
            previous_status=prev_status,
            new_status=complaint.status,
            message=f"Complaint assigned to {authority}{handler_label}. {assignment_note}".strip(),
            is_internal=False,
        )

        # Notify the student
        Notification.objects.create(
            recipient=complaint.student.user,
            complaint=complaint,
            notification_type='COMPLAINT_ASSIGNED',
            title=f"Complaint {complaint.complaint_id} Assigned to {authority}",
            message=f"Your complaint '{complaint.title}' has been assigned to {authority}{handler_label} for action.",
            email_sent=True,
        )

        # Notify the assigned complaint handler
        if target_admin:
            Notification.objects.create(
                recipient=target_admin.user,
                complaint=complaint,
                notification_type='COMPLAINT_ASSIGNED',
                title=f"New Assignment: Complaint {complaint.complaint_id}",
                message=(
                    f"{admin_profile.full_name} assigned complaint {complaint.complaint_id} "
                    f"({complaint.title}) to you under {authority}."
                ),
                email_sent=True,
            )

        log_admin_action(
            request,
            action='COMPLAINT_ASSIGNED',
            target_type='Complaint',
            target_id=complaint.complaint_id,
            details=f"Assigned {complaint.complaint_id} to {authority}{handler_label}.",
        )

        return Response({
            'message': f"Complaint {complaint.complaint_id} assigned to {authority}.",
            'assignment_id': assignment.id,
            'complaint': ComplaintAdminDetailSerializer(complaint, context={'request': request}).data,
        })


class AdminStudentListAPIView(APIView):
    """
    Lists student registrations and verified students for Verification & Account Management.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        qs = Student.objects.select_related('verification_record', 'verification_record__verified_by').all()
        status_filter = request.query_params.get('status', '').strip()
        department = request.query_params.get('department', '').strip()
        residence = request.query_params.get('residence_type', '').strip()
        search = request.query_params.get('search', '').strip()

        if status_filter and status_filter != 'ALL':
            qs = qs.filter(verification_status=status_filter)
        if department and department != 'ALL':
            qs = qs.filter(department__icontains=department)
        if residence and residence != 'ALL':
            qs = qs.filter(residence_type=residence)
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search)
                | Q(admission_number__icontains=search)
                | Q(email__icontains=search)
                | Q(hostel_name__icontains=search)
            )

        qs = qs.order_by('-created_at')
        roster_count = EligibleStudentRoster.objects.count()
        return Response({
            'count': qs.count(),
            'roster_count': roster_count,
            'results': StudentVerificationAdminSerializer(qs, many=True).data,
        })


class AdminStudentVerifyActionAPIView(APIView):
    """
    Approves, Rejects, or Suspends a student registration.
    """
    permission_classes = [IsPortalAdmin]

    @transaction.atomic
    def post(self, request, student_id):
        admin_profile = request.user.admin_profile
        student = get_object_or_404(Student, id=student_id)
        decision = (
            request.data.get('status')
            or request.data.get('decision')
            or ''
        ).upper().strip()
        notes = (request.data.get('notes') or '').strip()

        if decision not in ('APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'):
            return Response(
                {'error': True, 'message': 'Invalid verification status decision.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student.verification_status = decision
        student.save(update_fields=['verification_status', 'updated_at'])

        student.user.is_active = decision != 'SUSPENDED'
        student.user.save(update_fields=['is_active'])

        ver, _ = StudentVerification.objects.get_or_create(
            student=student,
            defaults={'admission_number_checked': student.admission_number},
        )
        ver.status = decision
        ver.verified_by = admin_profile
        ver.verified_at = timezone.now()
        if decision == 'REJECTED':
            ver.rejection_reason = notes or 'Student eligibility could not be verified against institutional records.'
        else:
            ver.verification_notes = notes or f"Status set to {decision} by {admin_profile.full_name}."
        ver.save()

        if decision == 'APPROVED':
            Notification.objects.create(
                recipient=student.user,
                notification_type='REGISTRATION_APPROVED',
                title='Your ABHAYA Student Account Has Been Approved',
                message=(
                    f"Welcome to ABHAYA, {student.full_name}! Your female student eligibility "
                    f"(Admission No: {student.admission_number}) has been verified and approved by "
                    f"{admin_profile.full_name}. You now have full access to the student dashboard."
                ),
                email_sent=True,
            )
            dispatch_portal_email(
                student.email,
                'Registration Approved – Welcome to ABHAYA',
                f"Dear {student.full_name}, your ABHAYA student account has been verified and approved. You can now log in.",
            )

        log_admin_action(
            request,
            action=f"STUDENT_{decision}",
            target_type='Student',
            target_id=student.admission_number,
            details=f"{student.full_name} ({student.admission_number}) marked as {decision}. Notes: {notes}",
        )

        return Response({
            'message': f"Student {student.full_name} ({student.admission_number}) status updated to {decision}.",
            'student': StudentVerificationAdminSerializer(student).data,
        })


class AdminRosterListCreateAPIView(APIView):
    """
    Allows administrators to view and add verified female student admission numbers
    to the institutional eligibility roster.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        entries = EligibleStudentRoster.objects.all().order_by('admission_number')
        data = [
            {
                'id': e.id,
                'admission_number': e.admission_number,
                'full_name': e.full_name,
                'email': e.email,
                'department': e.department,
                'year_semester': e.year_semester,
                'added_at': e.added_at,
            }
            for e in entries
        ]
        return Response({'count': len(data), 'results': data})

    def post(self, request):
        adm = (request.data.get('admission_number') or '').upper().strip()
        full_name = (request.data.get('full_name') or '').strip()
        email = (request.data.get('email') or '').lower().strip()
        department = (request.data.get('department') or 'Computer Science & Engineering').strip()
        year_semester = (request.data.get('year_semester') or 'S5/S6 (3rd Year)').strip()

        if not adm or not full_name or not email:
            return Response(
                {'error': True, 'message': 'Admission number, full name, and registered email are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entry, created = EligibleStudentRoster.objects.update_or_create(
            admission_number=adm,
            defaults={
                'full_name': full_name,
                'email': email,
                'department': department,
                'year_semester': year_semester,
                'is_verified_female_student': True,
            },
        )
        # Also update any existing StudentVerification record that matches
        StudentVerification.objects.filter(admission_number_checked__iexact=adm).update(roster_matched=True)

        log_admin_action(
            request,
            action='ROSTER_ENTRY_ADDED',
            target_type='EligibleStudentRoster',
            target_id=adm,
            details=f"{'Added' if created else 'Updated'} roster record for {full_name} ({adm}).",
        )
        return Response(
            {
                'message': f"Institutional roster entry for {full_name} ({adm}) saved.",
                'id': entry.id,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminHelplineListCreateAPIView(APIView):
    """
    Allows administrators to view all helplines and create new emergency contacts.
    Changes immediately reflect on the public Emergency Helplines page.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        qs = EmergencyContact.objects.all().order_by('display_order', '-is_featured', 'service_name')
        return Response(EmergencyContactSerializer(qs, many=True).data)

    def post(self, request):
        serializer = EmergencyContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save(updated_by=request.user.admin_profile)
        log_admin_action(
            request,
            action='HELPLINE_CREATED',
            target_type='EmergencyContact',
            target_id=contact.id,
            details=f"Added helpline '{contact.service_name}' ({contact.contact_number or 'Configurable'}).",
        )
        return Response(
            {
                'message': f"Helpline '{contact.service_name}' created and published.",
                'helpline': EmergencyContactSerializer(contact).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminHelplineDetailAPIView(APIView):
    """
    Allows administrators to update or delete an emergency helpline contact.
    """
    permission_classes = [IsPortalAdmin]

    def patch(self, request, pk):
        contact = get_object_or_404(EmergencyContact, pk=pk)
        serializer = EmergencyContactSerializer(contact, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save(updated_by=request.user.admin_profile)
        log_admin_action(
            request,
            action='HELPLINE_UPDATED',
            target_type='EmergencyContact',
            target_id=contact.id,
            details=f"Updated helpline '{contact.service_name}' -> Number: '{contact.contact_number}', Featured: {contact.is_featured}.",
        )
        return Response({
            'message': f"Helpline '{contact.service_name}' updated successfully.",
            'helpline': EmergencyContactSerializer(contact).data,
        })

    def delete(self, request, pk):
        contact = get_object_or_404(EmergencyContact, pk=pk)
        name = contact.service_name
        contact_id = contact.id
        contact.delete()
        log_admin_action(
            request,
            action='HELPLINE_DELETED',
            target_type='EmergencyContact',
            target_id=contact_id,
            details=f"Removed helpline '{name}'.",
        )
        return Response({'message': f"Helpline '{name}' removed."})


class AdminManagementListCreateAPIView(APIView):
    """
    Lists all administrators and allows Super Administrators to create new role-scoped admins.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        admins = Administrator.objects.all().order_by('admin_role', 'full_name')
        return Response(AdministratorSerializer(admins, many=True).data)

    def post(self, request):
        if request.user.admin_profile.admin_role != 'SUPER_ADMIN':
            return Response(
                {'error': True, 'message': 'Only a Super Administrator can create new administrator accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_admin = serializer.save()
        log_admin_action(
            request,
            action='ADMIN_CREATED',
            target_type='Administrator',
            target_id=new_admin.email,
            details=f"Created administrator {new_admin.full_name} with role {new_admin.get_admin_role_display()}.",
        )
        return Response(
            {
                'message': f"Administrator {new_admin.full_name} created successfully.",
                'administrator': AdministratorSerializer(new_admin).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminManagementDetailAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        target_admin = get_object_or_404(Administrator, pk=pk)
        for field in [
            'full_name',
            'phone_number',
            'designation',
            'admin_role',
            'department_or_unit',
            'assigned_authority_group',
            'can_view_confidential_identity',
            'is_active_admin',
        ]:
            if field in request.data:
                setattr(target_admin, field, request.data[field])
        target_admin.save()
        target_admin.user.is_active = target_admin.is_active_admin
        target_admin.user.save(update_fields=['is_active'])

        log_admin_action(
            request,
            action='ADMIN_UPDATED',
            target_type='Administrator',
            target_id=target_admin.email,
            details=(
                f"Updated administrator {target_admin.full_name}: role={target_admin.admin_role}, "
                f"confidential_access={target_admin.can_view_confidential_identity}, active={target_admin.is_active_admin}."
            ),
        )
        return Response({
            'message': f"Administrator {target_admin.full_name} updated.",
            'administrator': AdministratorSerializer(target_admin).data,
        })


class AdminReportsAnalyticsAPIView(APIView):
    """
    Provides comprehensive analytics, category/hostel/department breakdowns,
    resolution rate metrics, and audit log history.
    """
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        admin_profile = request.user.admin_profile
        scoped_qs = filter_complaints_for_admin(Complaint.objects.all(), admin_profile)

        total = scoped_qs.count()
        resolved_count = scoped_qs.filter(status__in=['RESOLVED', 'CLOSED']).count()
        confidential_count = scoped_qs.filter(confidentiality_preference='CONFIDENTIAL').count()
        urgent_count = scoped_qs.filter(priority='URGENT').count()
        resolution_rate = round((resolved_count / total) * 100, 1) if total > 0 else 0.0

        by_authority = list(
            scoped_qs.values('assigned_authority')
            .annotate(
                total=Count('id'),
                resolved=Count('id', filter=Q(status__in=['RESOLVED', 'CLOSED'])),
                pending=Count('id', filter=~Q(status__in=['RESOLVED', 'CLOSED'])),
            )
            .order_by('-total')
        )

        by_hostel = list(
            scoped_qs.values('student_hostel')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        by_department = list(
            scoped_qs.values('student_department')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        by_priority = list(
            scoped_qs.values('priority')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        audit_logs = AuditLog.objects.all().order_by('-created_at')[:40]

        status_labels = dict(Complaint.STATUS_CHOICES)
        status_counts = (
            scoped_qs.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        by_status = [
            {'status': status_labels.get(item['status'], item['status']), 'code': item['status'], 'count': item['count']}
            for item in status_counts
        ]

        return Response({
            'summary': {
                'total_complaints': total,
                'resolved_complaints': resolved_count,
                'resolution_rate_percent': resolution_rate,
                'confidential_complaints': confidential_count,
                'urgent_complaints': urgent_count,
            },
            'by_status': by_status,
            'by_authority': by_authority,
            'by_hostel': by_hostel,
            'by_department': by_department,
            'by_priority': by_priority,
            'audit_logs': AuditLogSerializer(audit_logs, many=True).data,
        })


class AdminPortalSettingsAPIView(APIView):
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        portal_setting, _ = PortalSetting.objects.get_or_create(id=1)
        data = PortalSettingSerializer(portal_setting).data
        email_val = request.user.email or 'abhayasfi@abhaya.edu.in'
        data['admin_username'] = email_val.split('@')[0] if '@' in email_val else email_val
        return Response(data)

    def patch(self, request):
        portal_setting, _ = PortalSetting.objects.get_or_create(id=1)
        serializer = PortalSettingSerializer(portal_setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        portal_setting = serializer.save()

        new_username = (request.data.get('admin_username') or '').strip().lower()
        new_password = (request.data.get('admin_new_password') or '').strip()
        user_obj = request.user
        admin_profile = getattr(user_obj, 'admin_profile', None)

        if new_username:
            new_email = new_username if '@' in new_username else f"{new_username}@abhaya.edu.in"
            if not PortalUser.objects.exclude(id=user_obj.id).filter(email=new_email).exists():
                user_obj.email = new_email
                user_obj.save(update_fields=['email'])
                if admin_profile:
                    admin_profile.email = new_email
                    admin_profile.save(update_fields=['email'])

        if new_password:
            user_obj.set_password(new_password)
            user_obj.save()

        log_admin_action(
            request,
            action='PORTAL_SETTINGS_UPDATED',
            target_type='PortalSetting',
            target_id='1',
            details=f"Updated portal configuration ({portal_setting.institution_name}).",
        )
        data = PortalSettingSerializer(portal_setting).data
        email_val = user_obj.email or 'abhayasfi@abhaya.edu.in'
        data['admin_username'] = email_val.split('@')[0] if '@' in email_val else email_val
        return Response(data)

