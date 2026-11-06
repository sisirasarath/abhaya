"""
Database Models for ABHAYA – Women's Safety and Support Portal.
Implements all required models:
1. PortalUser (Custom Auth User)
2. Student
3. Administrator
4. StudentVerification
5. EligibleStudentRoster (Institutional Female Student Verification Roster)
6. ComplaintCategory
7. Complaint
8. ComplaintAssignment
9. ComplaintUpdate
10. ComplaintAttachment
11. EmergencyContact
12. Notification
13. AuditLog
14. PortalSetting
"""
import uuid
from django.db import models, transaction
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class PortalUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('An institutional email address is required.')
        email = self.normalize_email(email).lower().strip()
        user = self.model(email=email, full_name=full_name.strip(), **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        user = self.create_user(email, full_name, password, **extra_fields)
        Administrator.objects.get_or_create(
            user=user,
            defaults={
                'full_name': full_name,
                'email': user.email,
                'designation': 'Super Administrator',
                'admin_role': 'SUPER_ADMIN',
                'department_or_unit': "ABHAYA Governance • SFI MACE Unit Initiative",
                'can_view_confidential_identity': True,
            }
        )
        return user


class PortalUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('STUDENT', 'Female Student'),
        ('ADMIN', 'Administrator'),
    )
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT', db_index=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    password_reset_token = models.CharField(max_length=128, blank=True, null=True)
    password_reset_expires = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PortalUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'abhaya_portal_user'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.email}) [{self.role}]"


class EligibleStudentRoster(models.Model):
    """
    Institutional roster of eligible female students used for automated cross-checking
    alongside administrator verification approval.
    """
    admission_number = models.CharField(max_length=50, unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    department = models.CharField(max_length=120)
    year_semester = models.CharField(max_length=60)
    is_verified_female_student = models.BooleanField(default=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'abhaya_eligible_student_roster'
        ordering = ['admission_number']

    def __str__(self):
        return f"{self.admission_number} - {self.full_name}"


class Student(models.Model):
    """
    Model 1: Student
    Verified female student profile linked to PortalUser.
    """
    RESIDENCE_CHOICES = (
        ('HOSTEL', 'Hostel Resident'),
        ('DAY_SCHOLAR', 'Day Scholar'),
    )
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending Verification'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    )

    user = models.OneToOneField(PortalUser, on_delete=models.CASCADE, related_name='student_profile')
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    admission_number = models.CharField(max_length=50, unique=True, db_index=True)
    department = models.CharField(max_length=120, db_index=True)
    year_semester = models.CharField(max_length=60)
    phone_number = models.CharField(max_length=25)
    residence_type = models.CharField(max_length=20, choices=RESIDENCE_CHOICES, default='HOSTEL')
    hostel_name = models.CharField(max_length=120, blank=True, default='')
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING',
        db_index=True,
    )
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'abhaya_student'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.admission_number}) - {self.verification_status}"


class Administrator(models.Model):
    """
    Model 2: Administrator
    Role-based administrator profile with strict permission levels.
    """
    ADMIN_ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Administrator'),
        ('WOMENS_CELL_ADMIN', "Women's Cell Administrator"),
        ('HOSTEL_ADMIN', 'Hostel Administrator'),
        ('COMPLAINT_HANDLER', 'Complaint Handler'),
    )

    user = models.OneToOneField(PortalUser, on_delete=models.CASCADE, related_name='admin_profile')
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=25, blank=True, default='')
    designation = models.CharField(max_length=120)
    admin_role = models.CharField(
        max_length=30,
        choices=ADMIN_ROLE_CHOICES,
        default='COMPLAINT_HANDLER',
        db_index=True,
    )
    department_or_unit = models.CharField(max_length=150, default="Women's Cell")
    assigned_authority_group = models.CharField(
        max_length=100,
        default="Women's Cell",
        help_text="Authority unit this admin represents (e.g., Women's Cell, Internal Complaints Committee, Hostel Warden, College Administration)",
    )
    can_view_confidential_identity = models.BooleanField(default=False)
    is_active_admin = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'abhaya_administrator'
        ordering = ['admin_role', 'full_name']

    def save(self, *args, **kwargs):
        if self.admin_role in ('SUPER_ADMIN', 'WOMENS_CELL_ADMIN'):
            self.can_view_confidential_identity = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} [{self.get_admin_role_display()}]"


class StudentVerification(models.Model):
    """
    Model 3: StudentVerification
    Tracks institutional eligibility verification, roster matching, and administrator approval workflow.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending Verification'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    )

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='verification_record')
    admission_number_checked = models.CharField(max_length=50)
    email_domain_valid = models.BooleanField(default=False)
    roster_matched = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    verified_by = models.ForeignKey(
        Administrator,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_students',
    )
    verification_notes = models.TextField(blank=True, default='')
    rejection_reason = models.TextField(blank=True, default='')
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'abhaya_student_verification'
        ordering = ['-created_at']

    def __str__(self):
        return f"Verification({self.student.admission_number}: {self.status})"


class ComplaintCategory(models.Model):
    """
    Model 5: ComplaintCategory
    Stores official ABHAYA grievance categories and subcategories.
    """
    CATEGORY_CODE_CHOICES = (
        ('HOSTEL', 'Hostel-Related Issues'),
        ('PERSONAL_SAFETY', 'Personal Safety'),
        ('COLLEGE_ISSUES', 'College-Related Issues'),
        ('EMERGENCY_URGENT', 'Emergency / Urgent Concerns'),
    )

    code = models.CharField(max_length=30, choices=CATEGORY_CODE_CHOICES, unique=True, db_index=True)
    name = models.CharField(max_length=120)
    description = models.TextField()
    subcategories = models.JSONField(default=list)
    default_authority = models.CharField(max_length=100, default="Women's Cell")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = 'abhaya_complaint_category'
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Complaint(models.Model):
    """
    Model 4: Complaint
    Core grievance record with strict backend confidentiality enforcement and tracking.
    """
    STATUS_CHOICES = (
        ('SUBMITTED', 'Submitted'),
        ('UNDER_REVIEW', 'Under Review'),
        ('ASSIGNED', 'Assigned'),
        ('ACTION_IN_PROGRESS', 'Action in Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    )
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    )
    CONTACT_METHOD_CHOICES = (
        ('PORTAL_ONLY', 'Secure Portal Updates Only'),
        ('EMAIL', 'Registered Email'),
        ('PHONE', 'Phone Call / SMS'),
        ('IN_PERSON', "In-Person Meeting with Women's Cell / ICC"),
    )
    CONFIDENTIALITY_CHOICES = (
        (
            'CONFIDENTIAL',
            'Keep my identity confidential from general complaint viewers, subject to the reporting and investigation process.',
        ),
        (
            'DISCLOSED',
            'I agree to disclose my identity to the authorized complaint-handling authority.',
        ),
    )

    complaint_id = models.CharField(max_length=30, unique=True, db_index=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='complaints')
    title = models.CharField(max_length=220)
    category = models.ForeignKey(
        ComplaintCategory,
        on_delete=models.PROTECT,
        related_name='complaints',
    )
    category_code = models.CharField(max_length=30, db_index=True)
    subcategory = models.CharField(max_length=140, db_index=True)
    description = models.TextField()
    incident_location = models.CharField(max_length=200)
    incident_date = models.DateField()
    incident_time = models.CharField(max_length=50, blank=True, default='')
    is_currently_occurring = models.BooleanField(default=False)
    immediate_assistance_required = models.BooleanField(default=False)
    preferred_contact_method = models.CharField(
        max_length=30,
        choices=CONTACT_METHOD_CHOICES,
        default='PORTAL_ONLY',
    )
    confidentiality_preference = models.CharField(
        max_length=20,
        choices=CONFIDENTIALITY_CHOICES,
        default='CONFIDENTIAL',
    )
    priority = models.CharField(
        max_length=15,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        db_index=True,
    )
    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='SUBMITTED',
        db_index=True,
    )
    assigned_authority = models.CharField(max_length=120, blank=True, default="Women's Cell")
    assigned_handler = models.ForeignKey(
        Administrator,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints',
    )
    # Anonymized demographic fields for aggregate statistics without exposing student identity
    student_department = models.CharField(max_length=120, blank=True, default='', db_index=True)
    student_hostel = models.CharField(max_length=120, blank=True, default='', db_index=True)
    resolution_details = models.TextField(blank=True, default='')
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'abhaya_complaint'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.category_code and self.category_id:
            self.category_code = self.category.code
        if self.student_id and not self.student_department:
            self.student_department = self.student.department
        if self.student_id and not self.student_hostel:
            self.student_hostel = self.student.hostel_name or 'Day Scholar'

        if not self.complaint_id:
            year = timezone.now().year
            with transaction.atomic():
                last = (
                    Complaint.objects.select_for_update()
                    .filter(complaint_id__startswith=f"ABH-{year}-")
                    .order_by('-complaint_id')
                    .first()
                )
                seq = 1001
                if last:
                    try:
                        seq = int(last.complaint_id.split('-')[-1]) + 1
                    except (ValueError, IndexError):
                        seq = Complaint.objects.count() + 1001
                self.complaint_id = f"ABH-{year}-{seq:06d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.complaint_id} - {self.title} [{self.status}]"


class ComplaintAssignment(models.Model):
    """
    Model 6: ComplaintAssignment
    Maintains chronological history of complaint assignments to designated authorities.
    """
    AUTHORITY_CHOICES = (
        ("Women's Cell", "Women's Cell"),
        ('Internal Complaints Committee', 'Internal Complaints Committee (ICC)'),
        ('Hostel Warden', 'Hostel Warden'),
        ('College Administration', 'College Administration'),
        ('Other Authorized Support Personnel', 'Other Authorized Support Personnel'),
    )

    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='assignments')
    assigned_to_authority = models.CharField(max_length=120, choices=AUTHORITY_CHOICES)
    assigned_to_admin = models.ForeignKey(
        Administrator,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_assignments',
    )
    assigned_by = models.ForeignKey(
        Administrator,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='made_assignments',
    )
    assignment_note = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'abhaya_complaint_assignment'
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.complaint.complaint_id} -> {self.assigned_to_authority}"


class ComplaintUpdate(models.Model):
    """
    Model 7: ComplaintUpdate
    Chronological timeline of status changes, student-visible updates, internal admin notes,
    and student follow-up responses.
    """
    UPDATE_TYPE_CHOICES = (
        ('SUBMITTED', 'Complaint Submitted'),
        ('STATUS_CHANGE', 'Status Updated'),
        ('ASSIGNMENT', 'Authority Assigned'),
        ('ADMIN_UPDATE', 'Official Update from Authority'),
        ('INTERNAL_NOTE', 'Internal Administrative Note (Confidential)'),
        ('STUDENT_RESPONSE', 'Additional Information from Student'),
        ('RESOLUTION', 'Resolution Recorded'),
    )

    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='updates')
    author_user = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaint_updates',
    )
    author_role = models.CharField(max_length=20, default='ADMIN')
    author_display_name = models.CharField(max_length=150, default='ABHAYA System')
    update_type = models.CharField(max_length=30, choices=UPDATE_TYPE_CHOICES, default='ADMIN_UPDATE')
    previous_status = models.CharField(max_length=25, blank=True, default='')
    new_status = models.CharField(max_length=25, blank=True, default='')
    message = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        db_index=True,
        help_text='If True, this note is strictly internal to administrators and never exposed to students.',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'abhaya_complaint_update'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.complaint.complaint_id} [{self.update_type}] at {self.created_at}"


class ComplaintAttachment(models.Model):
    """
    Model 8: ComplaintAttachment
    Securely stored supporting documents/images attached to a complaint.
    """
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_attachments',
    )
    file = models.FileField(upload_to='complaint_attachments/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField(default=0)
    description = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'abhaya_complaint_attachment'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.original_filename} ({self.complaint.complaint_id})"


class EmergencyContact(models.Model):
    """
    Model 9: EmergencyContact
    Publicly accessible emergency helplines, configurable by administrators.
    """
    CATEGORY_CHOICES = (
        ('NATIONAL', 'National & State Emergency Helplines'),
        ('POLICE_LEGAL', 'Women Police & Cyber Safety Helplines'),
        ('COLLEGE_CELL', "College Women's Cell & ICC"),
        ('HOSTEL_SECURITY', 'Hostel Warden & Campus Security'),
        ('SUPPORT_COUNSELING', 'Local Support & Counseling Services'),
    )

    service_name = models.CharField(max_length=160)
    contact_number = models.CharField(
        max_length=60,
        blank=True,
        default='',
        help_text='Verified dialable telephone number. Leave empty or configurable placeholder if college number is not yet configured.',
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='NATIONAL', db_index=True)
    description = models.TextField()
    availability_note = models.CharField(max_length=160, default='24/7 Emergency Support')
    is_verified_number = models.BooleanField(
        default=True,
        help_text='True if contact_number is a verified dialable phone number; False if awaiting institutional configuration.',
    )
    is_featured = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    display_order = models.PositiveSmallIntegerField(default=10)
    updated_by = models.ForeignKey(
        Administrator,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_helplines',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'abhaya_emergency_contact'
        ordering = ['display_order', '-is_featured', 'service_name']

    def __str__(self):
        return f"{self.service_name} ({self.contact_number or 'Configurable Placeholder'})"


class Notification(models.Model):
    """
    Model 10: Notification
    Website-based notification record for students and administrators, plus configurable SMTP dispatch status.
    """
    TYPE_CHOICES = (
        ('REGISTRATION_APPROVED', 'Registration Approved'),
        ('COMPLAINT_SUBMITTED', 'Complaint Submission Confirmation'),
        ('STATUS_UPDATED', 'Complaint Status Updated'),
        ('COMPLAINT_ASSIGNED', 'Complaint Assigned'),
        ('INFO_REQUESTED', 'Additional Information Update'),
        ('COMPLAINT_RESOLVED', 'Complaint Resolved'),
        ('NEW_COMPLAINT_ALERT', 'New Complaint Submitted'),
    )

    recipient = models.ForeignKey(PortalUser, on_delete=models.CASCADE, related_name='notifications')
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    notification_type = models.CharField(max_length=35, choices=TYPE_CHOICES, default='STATUS_UPDATED')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'abhaya_notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"To {self.recipient.email}: {self.title}"


class AuditLog(models.Model):
    """
    Model 11: AuditLog
    Immutable audit log recording all sensitive administrative actions and confidential access.
    """
    actor = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    actor_email = models.CharField(max_length=150)
    actor_role = models.CharField(max_length=60)
    action = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=60)
    target_id = models.CharField(max_length=80)
    details = models.TextField()
    ip_address = models.CharField(max_length=60, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'abhaya_audit_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at}] {self.actor_email} -> {self.action} ({self.target_id})"


class PortalSetting(models.Model):
    """
    Configurable institutional settings for ABHAYA Portal so no college-specific details
    need to be hardcoded or invented.
    """
    institution_name = models.CharField(
        max_length=200,
        default='[Configurable College Name — Set in Admin Settings]',
    )
    initiative_subtitle = models.CharField(
        max_length=200,
        default="An Initiative by SFI MACE Unit",
    )
    campus_location = models.CharField(
        max_length=200,
        default='[Configurable Campus Address — Set in Admin Settings]',
    )
    official_contact_email = models.EmailField(
        default='womenscell@college-placeholder.edu.in',
    )
    allowed_email_domains = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Optional comma-separated allowed domains (e.g. cet.ac.in,gectcr.ac.in). Leave blank to allow any institutional email subject to admin approval.',
    )
    auto_approve_roster_matches = models.BooleanField(
        default=False,
        help_text='If enabled, registrations matching the verified female student roster are automatically approved; otherwise all registrations require manual administrator approval.',
    )
    enable_email_notifications = models.BooleanField(default=True)
    smtp_host = models.CharField(max_length=150, default='smtp.college-placeholder.edu.in')
    smtp_port = models.PositiveIntegerField(default=587)
    smtp_sender_email = models.EmailField(default='abhaya-noreply@college-placeholder.edu.in')
    confidentiality_policy_summary = models.TextField(
        default=(
            "ABHAYA enforces strict backend confidentiality. When a student selects 'Keep my identity confidential', "
            "identifiable student details are redacted at the API and database query layer from general complaint "
            "handlers and are accessible only to specifically authorized POSH/ICC/Women's Cell officers for formal redressal."
        )
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'abhaya_portal_setting'

    def __str__(self):
        return f"ABHAYA Portal Settings ({self.institution_name})"

