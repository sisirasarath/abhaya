"""
Serializers for ABHAYA – Women's Safety and Support Portal.
Enforces strict backend confidentiality redaction, input validation, and role-based serialization.
"""
import os
from PIL import Image
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

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
from .permissions import can_admin_view_student_identity


def validate_uploaded_file(uploaded_file):
    """Validates file size, extension, external storage availability on serverless, and image integrity."""
    if getattr(settings, 'IS_VERCEL', False) and not getattr(settings, 'AWS_STORAGE_BUCKET_NAME', ''):
        raise serializers.ValidationError(
            "File attachments require external S3-compatible object storage (AWS_STORAGE_BUCKET_NAME) to be configured in production."
        )
    max_size = getattr(settings, 'MAX_ATTACHMENT_SIZE_BYTES', 5 * 1024 * 1024)
    if uploaded_file.size > max_size:
        raise serializers.ValidationError(
            f"File '{uploaded_file.name}' exceeds the maximum allowed size of 5 MB."
        )
    ext = os.path.splitext(uploaded_file.name)[1].lower()
    allowed_exts = getattr(
        settings,
        'ALLOWED_ATTACHMENT_EXTENSIONS',
        {'.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'},
    )
    if ext not in allowed_exts:
        raise serializers.ValidationError(
            f"Unsupported file extension '{ext}'. Allowed formats: JPG, PNG, WEBP, PDF, DOC, DOCX."
        )
    if ext in {'.jpg', '.jpeg', '.png', '.webp'}:
        try:
            img = Image.open(uploaded_file)
            img.verify()
            uploaded_file.seek(0)
        except Exception as exc:
            raise serializers.ValidationError(
                f"Uploaded image '{uploaded_file.name}' is corrupted or invalid."
            ) from exc
    return uploaded_file


class EmergencyContactSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyContact
        fields = [
            'id',
            'service_name',
            'contact_number',
            'category',
            'category_display',
            'description',
            'availability_note',
            'is_verified_number',
            'is_featured',
            'is_active',
            'display_order',
            'updated_by_name',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_by_name', 'updated_at']

    def get_updated_by_name(self, obj):
        return obj.updated_by.full_name if obj.updated_by else 'System Default'


class PortalSettingSerializer(serializers.ModelSerializer):
    active_database = serializers.SerializerMethodField()

    class Meta:
        model = PortalSetting
        fields = [
            'id',
            'institution_name',
            'initiative_subtitle',
            'campus_location',
            'official_contact_email',
            'allowed_email_domains',
            'auto_approve_roster_matches',
            'enable_email_notifications',
            'smtp_host',
            'smtp_port',
            'smtp_sender_email',
            'confidentiality_policy_summary',
            'active_database',
            'updated_at',
        ]
        read_only_fields = ['id', 'active_database', 'updated_at']

    def get_active_database(self, obj):
        return getattr(settings, 'ACTIVE_DATABASE_BACKEND', 'PostgreSQL')


class StudentRegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    gender = serializers.CharField(max_length=20, required=False, default='FEMALE')
    email = serializers.EmailField()
    admission_number = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=120)
    year_semester = serializers.CharField(max_length=60)
    phone_number = serializers.CharField(max_length=25)
    residence_type = serializers.ChoiceField(choices=Student.RESIDENCE_CHOICES)
    hostel_name = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate_gender(self, value):
        g = (value or '').strip().upper()
        if g != 'FEMALE':
            raise serializers.ValidationError(
                'ABHAYA is a women\'s safety portal exclusively for female students. Only female students can register.'
            )
        return 'FEMALE'

    def validate_email(self, value):
        email = value.lower().strip()
        if PortalUser.objects.filter(email=email).exists() or Student.objects.filter(email=email).exists():
            raise serializers.ValidationError('An account with this registered email address already exists.')
        portal_setting = PortalSetting.objects.first()
        if portal_setting and portal_setting.allowed_email_domains.strip():
            domains = [
                d.strip().lower()
                for d in portal_setting.allowed_email_domains.split(',')
                if d.strip()
            ]
            email_domain = email.split('@')[-1]
            if domains and email_domain not in domains:
                raise serializers.ValidationError(
                    f"Registration requires an institutional email from: {', '.join(domains)}"
                )
        return email

    def validate_admission_number(self, value):
        adm = value.upper().strip()
        if Student.objects.filter(admission_number=adm).exists():
            raise serializers.ValidationError(
                'A student account with this admission/registration number is already registered.'
            )
        return adm

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        if attrs.get('residence_type') == 'HOSTEL' and not attrs.get('hostel_name', '').strip():
            raise serializers.ValidationError(
                {'hostel_name': 'Please specify your Hostel Name since you selected Hostel Resident.'}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data['email']
        adm_no = validated_data['admission_number']
        full_name = validated_data['full_name'].strip()

        roster_entry = EligibleStudentRoster.objects.filter(
            admission_number__iexact=adm_no,
            is_verified_female_student=True,
        ).first() or EligibleStudentRoster.objects.filter(
            email__iexact=email,
            is_verified_female_student=True,
        ).first()

        roster_matched = roster_entry is not None
        initial_status = 'APPROVED'

        user = PortalUser.objects.create_user(
            email=email,
            full_name=full_name,
            password=validated_data['password'],
            role='STUDENT',
            is_active=True,
        )

        student = Student.objects.create(
            user=user,
            full_name=full_name,
            email=email,
            admission_number=adm_no,
            department=validated_data['department'].strip(),
            year_semester=validated_data['year_semester'].strip(),
            phone_number=validated_data['phone_number'].strip(),
            residence_type=validated_data['residence_type'],
            hostel_name=(
                validated_data.get('hostel_name', '').strip()
                if validated_data['residence_type'] == 'HOSTEL'
                else 'Day Scholar'
            ),
            verification_status=initial_status,
            is_email_verified=True,
        )

        email_domain_valid = email.endswith('.edu.in') or email.endswith('.ac.in')
        StudentVerification.objects.create(
            student=student,
            admission_number_checked=adm_no,
            email_domain_valid=email_domain_valid,
            roster_matched=roster_matched,
            status=initial_status,
            verification_notes=(
                'Matched against institutional female student roster during registration.'
                if roster_matched
                else 'Awaiting administrator verification against college admission records.'
            ),
            verified_at=timezone.now(),
        )

        # Notify Super Admin and Women's Cell Admin of new student registration
        admin_users = PortalUser.objects.filter(
            role='ADMIN',
            admin_profile__admin_role__in=['SUPER_ADMIN', 'WOMENS_CELL_ADMIN'],
        )
        for admin_user in admin_users:
            Notification.objects.create(
                recipient=admin_user,
                notification_type='REGISTRATION_APPROVED',
                title=f"New Student Registration: {full_name} ({adm_no})",
                message=(
                    f"{full_name} ({adm_no}, {student.department}) submitted a registration request. "
                    f"Roster Match: {'Yes' if roster_matched else 'Manual Check Required'}. "
                    f"Current Status: {student.get_verification_status_display()}."
                ),
            )

        return student


class StudentProfileSerializer(serializers.ModelSerializer):
    residence_type_display = serializers.CharField(source='get_residence_type_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    roster_matched = serializers.SerializerMethodField()
    verified_at = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'full_name',
            'email',
            'admission_number',
            'department',
            'year_semester',
            'phone_number',
            'residence_type',
            'residence_type_display',
            'hostel_name',
            'verification_status',
            'verification_status_display',
            'is_email_verified',
            'roster_matched',
            'verified_at',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'admission_number',
            'verification_status',
            'verification_status_display',
            'is_email_verified',
            'roster_matched',
            'verified_at',
            'created_at',
        ]

    def get_roster_matched(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.roster_matched if ver else False

    def get_verified_at(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.verified_at if ver else None


class StudentVerificationAdminSerializer(serializers.ModelSerializer):
    residence_type_display = serializers.CharField(source='get_residence_type_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    roster_matched = serializers.SerializerMethodField()
    email_domain_valid = serializers.SerializerMethodField()
    verification_notes = serializers.SerializerMethodField()
    rejection_reason = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    verified_at = serializers.SerializerMethodField()
    total_complaints = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'full_name',
            'email',
            'admission_number',
            'department',
            'year_semester',
            'phone_number',
            'residence_type',
            'residence_type_display',
            'hostel_name',
            'verification_status',
            'verification_status_display',
            'is_email_verified',
            'roster_matched',
            'email_domain_valid',
            'verification_notes',
            'rejection_reason',
            'verified_by_name',
            'verified_at',
            'total_complaints',
            'created_at',
        ]

    def get_roster_matched(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.roster_matched if ver else False

    def get_email_domain_valid(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.email_domain_valid if ver else False

    def get_verification_notes(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.verification_notes if ver else ''

    def get_rejection_reason(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.rejection_reason if ver else ''

    def get_verified_by_name(self, obj):
        ver = getattr(obj, 'verification_record', None)
        if ver and ver.verified_by:
            return ver.verified_by.full_name
        return None

    def get_verified_at(self, obj):
        ver = getattr(obj, 'verification_record', None)
        return ver.verified_at if ver else None

    def get_total_complaints(self, obj):
        return obj.complaints.count()


class AdministratorSerializer(serializers.ModelSerializer):
    admin_role_display = serializers.CharField(source='get_admin_role_display', read_only=True)

    class Meta:
        model = Administrator
        fields = [
            'id',
            'full_name',
            'email',
            'phone_number',
            'designation',
            'admin_role',
            'admin_role_display',
            'department_or_unit',
            'assigned_authority_group',
            'can_view_confidential_identity',
            'is_active_admin',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=25, required=False, allow_blank=True, default='')
    designation = serializers.CharField(max_length=120)
    admin_role = serializers.ChoiceField(choices=Administrator.ADMIN_ROLE_CHOICES)
    department_or_unit = serializers.CharField(max_length=150)
    assigned_authority_group = serializers.CharField(max_length=100, default="Women's Cell")
    can_view_confidential_identity = serializers.BooleanField(default=False)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.lower().strip()
        if PortalUser.objects.filter(email=email).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return email

    @transaction.atomic
    def create(self, validated_data):
        user = PortalUser.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            role='ADMIN',
            is_staff=True,
            is_active=True,
        )
        admin = Administrator.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            email=validated_data['email'],
            phone_number=validated_data.get('phone_number', ''),
            designation=validated_data['designation'],
            admin_role=validated_data['admin_role'],
            department_or_unit=validated_data['department_or_unit'],
            assigned_authority_group=validated_data.get('assigned_authority_group', "Women's Cell"),
            can_view_confidential_identity=validated_data.get('can_view_confidential_identity', False),
            is_active_admin=True,
        )
        return admin


class ComplaintCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintCategory
        fields = [
            'id',
            'code',
            'name',
            'description',
            'subcategories',
            'default_authority',
            'display_order',
        ]


class ComplaintAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintAttachment
        fields = [
            'id',
            'original_filename',
            'content_type',
            'file_size',
            'description',
            'file_url',
            'created_at',
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class ComplaintUpdateStudentSerializer(serializers.ModelSerializer):
    """
    Student-facing timeline serializer.
    Never exposes internal admin notes (`is_internal=True` is filtered out at queryset level).
    """
    update_type_display = serializers.CharField(source='get_update_type_display', read_only=True)

    class Meta:
        model = ComplaintUpdate
        fields = [
            'id',
            'author_role',
            'author_display_name',
            'update_type',
            'update_type_display',
            'previous_status',
            'new_status',
            'message',
            'created_at',
        ]


class ComplaintUpdateAdminSerializer(serializers.ModelSerializer):
    """
    Admin-facing timeline serializer including `is_internal` notes.
    Also redacts student author name if the complaint is confidential and the viewing admin
    does not have confidential identity clearance.
    """
    update_type_display = serializers.CharField(source='get_update_type_display', read_only=True)
    author_display_name = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintUpdate
        fields = [
            'id',
            'author_role',
            'author_display_name',
            'update_type',
            'update_type_display',
            'previous_status',
            'new_status',
            'message',
            'is_internal',
            'created_at',
        ]

    def get_author_display_name(self, obj):
        if obj.author_role == 'STUDENT':
            admin_profile = self.context.get('admin_profile')
            if not can_admin_view_student_identity(obj.complaint, admin_profile):
                return 'Confidential Female Student (Protected)'
        return obj.author_display_name


class ComplaintAssignmentSerializer(serializers.ModelSerializer):
    assigned_to_admin_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintAssignment
        fields = [
            'id',
            'assigned_to_authority',
            'assigned_to_admin',
            'assigned_to_admin_name',
            'assigned_by_name',
            'assignment_note',
            'is_active',
            'assigned_at',
        ]

    def get_assigned_to_admin_name(self, obj):
        if obj.assigned_to_admin:
            return f"{obj.assigned_to_admin.full_name} ({obj.assigned_to_admin.designation})"
        return None

    def get_assigned_by_name(self, obj):
        return obj.assigned_by.full_name if obj.assigned_by else 'System Auto-Routing'


class ComplaintStudentListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    confidentiality_display = serializers.CharField(source='get_confidentiality_preference_display', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'complaint_id',
            'title',
            'category_code',
            'category_name',
            'subcategory',
            'incident_location',
            'incident_date',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'assigned_authority',
            'confidentiality_preference',
            'confidentiality_display',
            'is_currently_occurring',
            'immediate_assistance_required',
            'created_at',
            'updated_at',
        ]


class ComplaintStudentDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    preferred_contact_display = serializers.CharField(source='get_preferred_contact_method_display', read_only=True)
    confidentiality_display = serializers.CharField(source='get_confidentiality_preference_display', read_only=True)
    assigned_handler_name = serializers.SerializerMethodField()
    updates = serializers.SerializerMethodField()
    attachments = ComplaintAttachmentSerializer(many=True, read_only=True)
    assignments = ComplaintAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'complaint_id',
            'title',
            'category_code',
            'category_name',
            'subcategory',
            'description',
            'incident_location',
            'incident_date',
            'incident_time',
            'is_currently_occurring',
            'immediate_assistance_required',
            'preferred_contact_method',
            'preferred_contact_display',
            'confidentiality_preference',
            'confidentiality_display',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'assigned_authority',
            'assigned_handler_name',
            'resolution_details',
            'resolved_at',
            'closed_at',
            'created_at',
            'updated_at',
            'updates',
            'attachments',
            'assignments',
        ]

    def get_assigned_handler_name(self, obj):
        if obj.assigned_handler:
            return f"{obj.assigned_handler.full_name} ({obj.assigned_handler.designation})"
        return obj.assigned_authority

    def get_updates(self, obj):
        # Strictly filter out internal administrative notes at the backend serializer level
        public_updates = obj.updates.filter(is_internal=False).order_by('created_at')
        return ComplaintUpdateStudentSerializer(public_updates, many=True).data


class ComplaintAdminListSerializer(serializers.ModelSerializer):
    """
    Admin complaint list serializer with strict backend confidentiality enforcement.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    student_display_name = serializers.SerializerMethodField()
    student_admission_number = serializers.SerializerMethodField()
    identity_is_redacted = serializers.SerializerMethodField()
    assigned_handler_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id',
            'complaint_id',
            'title',
            'category_code',
            'category_name',
            'subcategory',
            'incident_location',
            'incident_date',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'assigned_authority',
            'assigned_handler_name',
            'confidentiality_preference',
            'identity_is_redacted',
            'student_display_name',
            'student_admission_number',
            'student_department',
            'student_hostel',
            'is_currently_occurring',
            'immediate_assistance_required',
            'created_at',
            'updated_at',
        ]

    def _can_view_identity(self, obj):
        request = self.context.get('request')
        admin_profile = getattr(request.user, 'admin_profile', None) if request and request.user else None
        return can_admin_view_student_identity(obj, admin_profile)

    def get_identity_is_redacted(self, obj):
        return not self._can_view_identity(obj)

    def get_student_display_name(self, obj):
        if self._can_view_identity(obj):
            return obj.student.full_name
        return 'Confidential Female Student (Protected)'

    def get_student_admission_number(self, obj):
        if self._can_view_identity(obj):
            return obj.student.admission_number
        return 'REDACTED'

    def get_assigned_handler_name(self, obj):
        if obj.assigned_handler:
            return obj.assigned_handler.full_name
        return None


class ComplaintAdminDetailSerializer(serializers.ModelSerializer):
    """
    Admin complaint detail serializer.
    Enforces backend confidentiality: identifiable student info is stripped unless the admin
    is authorized (e.g. Super Admin / Women's Cell Admin or Disclosed preference).
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    preferred_contact_display = serializers.CharField(source='get_preferred_contact_method_display', read_only=True)
    confidentiality_display = serializers.CharField(source='get_confidentiality_preference_display', read_only=True)
    identity_is_redacted = serializers.SerializerMethodField()
    student_info = serializers.SerializerMethodField()
    assigned_handler_info = serializers.SerializerMethodField()
    updates = serializers.SerializerMethodField()
    attachments = ComplaintAttachmentSerializer(many=True, read_only=True)
    assignments = ComplaintAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'complaint_id',
            'title',
            'category_code',
            'category_name',
            'subcategory',
            'description',
            'incident_location',
            'incident_date',
            'incident_time',
            'is_currently_occurring',
            'immediate_assistance_required',
            'preferred_contact_method',
            'preferred_contact_display',
            'confidentiality_preference',
            'confidentiality_display',
            'identity_is_redacted',
            'student_info',
            'student_department',
            'student_hostel',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'assigned_authority',
            'assigned_handler',
            'assigned_handler_info',
            'resolution_details',
            'resolved_at',
            'closed_at',
            'created_at',
            'updated_at',
            'updates',
            'attachments',
            'assignments',
        ]

    def _get_admin_profile(self):
        request = self.context.get('request')
        return getattr(request.user, 'admin_profile', None) if request and request.user else None

    def get_identity_is_redacted(self, obj):
        return not can_admin_view_student_identity(obj, self._get_admin_profile())

    def get_student_info(self, obj):
        admin_profile = self._get_admin_profile()
        if can_admin_view_student_identity(obj, admin_profile):
            return {
                'is_redacted': False,
                'full_name': obj.student.full_name,
                'admission_number': obj.student.admission_number,
                'email': obj.student.email,
                'phone_number': obj.student.phone_number,
                'department': obj.student.department,
                'year_semester': obj.student.year_semester,
                'residence_type': obj.student.get_residence_type_display(),
                'hostel_name': obj.student.hostel_name,
                'confidentiality_note': (
                    'Student selected CONFIDENTIAL, but your role is authorized for POSH/ICC investigation access.'
                    if obj.confidentiality_preference == 'CONFIDENTIAL'
                    else 'Student consented to disclose identity to the complaint-handling authority.'
                ),
            }
        return {
            'is_redacted': True,
            'full_name': 'Confidential Female Student (Identity Protected by Backend)',
            'admission_number': '[REDACTED — CONFIDENTIAL]',
            'email': '[REDACTED — CONFIDENTIAL]',
            'phone_number': '[REDACTED — CONFIDENTIAL]',
            'department': obj.student_department,
            'year_semester': '[Protected]',
            'residence_type': 'Hostel Resident' if obj.student_hostel != 'Day Scholar' else 'Day Scholar',
            'hostel_name': obj.student_hostel,
            'confidentiality_note': (
                'This student requested identity confidentiality. Identifiable fields are stripped at the backend API level '
                'for general complaint handlers.'
            ),
        }

    def get_assigned_handler_info(self, obj):
        if obj.assigned_handler:
            return {
                'id': obj.assigned_handler.id,
                'full_name': obj.assigned_handler.full_name,
                'designation': obj.assigned_handler.designation,
                'admin_role_display': obj.assigned_handler.get_admin_role_display(),
            }
        return None

    def get_updates(self, obj):
        admin_profile = self._get_admin_profile()
        qs = obj.updates.all().order_by('created_at')
        return ComplaintUpdateAdminSerializer(
            qs,
            many=True,
            context={'admin_profile': admin_profile},
        ).data


class ComplaintCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=220)
    category_code = serializers.ChoiceField(choices=ComplaintCategory.CATEGORY_CODE_CHOICES)
    subcategory = serializers.CharField(max_length=140)
    description = serializers.CharField(min_length=15)
    incident_location = serializers.CharField(max_length=200)
    incident_date = serializers.DateField()
    incident_time = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    is_currently_occurring = serializers.BooleanField(default=False)
    immediate_assistance_required = serializers.BooleanField(default=False)
    preferred_contact_method = serializers.ChoiceField(
        choices=Complaint.CONTACT_METHOD_CHOICES,
        default='PORTAL_ONLY',
    )
    confidentiality_preference = serializers.ChoiceField(
        choices=Complaint.CONFIDENTIALITY_CHOICES,
        default='CONFIDENTIAL',
    )

    def validate_incident_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError('Incident date cannot be in the future.')
        return value

    def validate(self, attrs):
        cat_code = attrs['category_code']
        category = ComplaintCategory.objects.filter(code=cat_code).first()
        if not category:
            raise serializers.ValidationError({'category_code': 'Selected complaint category does not exist.'})
        attrs['category_obj'] = category
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        student = request.user.student_profile
        category = validated_data['category_obj']
        cat_code = category.code
        subcat = validated_data['subcategory'].strip()
        is_occurring = validated_data.get('is_currently_occurring', False)
        immediate_req = validated_data.get('immediate_assistance_required', False)

        # Determine initial priority based on urgency and category
        if cat_code == 'EMERGENCY_URGENT' or immediate_req or is_occurring:
            priority = 'URGENT'
        elif cat_code == 'PERSONAL_SAFETY' or 'harassment' in subcat.lower() or 'stalking' in subcat.lower() or 'threat' in subcat.lower():
            priority = 'HIGH'
        elif 'security' in subcat.lower() or 'warden' in subcat.lower() or 'washroom' in subcat.lower():
            priority = 'HIGH'
        else:
            priority = 'MEDIUM'

        # Determine default assigned authority
        if cat_code == 'HOSTEL' and 'harassment' not in subcat.lower():
            default_authority = 'Hostel Warden'
        elif cat_code == 'PERSONAL_SAFETY' or 'harassment' in subcat.lower():
            default_authority = 'Internal Complaints Committee'
        else:
            default_authority = category.default_authority or "Women's Cell"

        complaint = Complaint.objects.create(
            student=student,
            title=validated_data['title'].strip(),
            category=category,
            category_code=cat_code,
            subcategory=subcat,
            description=validated_data['description'].strip(),
            incident_location=validated_data['incident_location'].strip(),
            incident_date=validated_data['incident_date'],
            incident_time=validated_data.get('incident_time', '').strip(),
            is_currently_occurring=is_occurring,
            immediate_assistance_required=immediate_req,
            preferred_contact_method=validated_data['preferred_contact_method'],
            confidentiality_preference=validated_data['confidentiality_preference'],
            priority=priority,
            status='SUBMITTED',
            assigned_authority=default_authority,
            student_department=student.department,
            student_hostel=student.hostel_name or 'Day Scholar',
        )

        # Create initial timeline entry
        ComplaintUpdate.objects.create(
            complaint=complaint,
            author_user=request.user,
            author_role='STUDENT',
            author_display_name=student.full_name,
            update_type='SUBMITTED',
            previous_status='',
            new_status='SUBMITTED',
            message=(
                f"Complaint submitted under {category.name} — {subcat}. "
                f"Initial priority assessed as {complaint.get_priority_display()}. "
                f"Routed to {default_authority}."
            ),
            is_internal=False,
        )

        # Record initial authority routing in ComplaintAssignment
        ComplaintAssignment.objects.create(
            complaint=complaint,
            assigned_to_authority=default_authority,
            assigned_to_admin=None,
            assigned_by=None,
            assignment_note=f"Automated initial routing to {default_authority} based on grievance category ({category.name}).",
            is_active=True,
        )

        # Handle optional file uploads
        files = request.FILES.getlist('attachments')
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

        # Create confirmation notification for the student
        Notification.objects.create(
            recipient=request.user,
            complaint=complaint,
            notification_type='COMPLAINT_SUBMITTED',
            title=f"Complaint Registered: {complaint.complaint_id}",
            message=(
                f"Your complaint '{complaint.title}' has been securely registered with ID {complaint.complaint_id} "
                f"and routed to {default_authority}. You can track all progress updates in My Complaints."
            ),
            email_sent=True,
        )

        # Notify relevant administrators
        admins = PortalUser.objects.filter(role='ADMIN', is_active=True)
        for admin_user in admins:
            Notification.objects.create(
                recipient=admin_user,
                complaint=complaint,
                notification_type='NEW_COMPLAINT_ALERT',
                title=f"[{complaint.get_priority_display()}] New Grievance {complaint.complaint_id}",
                message=(
                    f"New {category.name} ({subcat}) complaint submitted at {complaint.incident_location}. "
                    f"Assigned Authority: {default_authority}."
                ),
            )

        return complaint


class NotificationSerializer(serializers.ModelSerializer):
    complaint_id_code = serializers.SerializerMethodField()
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'complaint',
            'complaint_id_code',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'is_read',
            'email_sent',
            'created_at',
        ]

    def get_complaint_id_code(self, obj):
        return obj.complaint.complaint_id if obj.complaint else None


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor_email',
            'actor_role',
            'action',
            'target_type',
            'target_id',
            'details',
            'ip_address',
            'created_at',
        ]

