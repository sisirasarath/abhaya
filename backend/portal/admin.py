from django.contrib import admin
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

admin.site.register(PortalUser)
admin.site.register(EligibleStudentRoster)
admin.site.register(Student)
admin.site.register(Administrator)
admin.site.register(StudentVerification)
admin.site.register(ComplaintCategory)
admin.site.register(Complaint)
admin.site.register(ComplaintAssignment)
admin.site.register(ComplaintUpdate)
admin.site.register(ComplaintAttachment)
admin.site.register(EmergencyContact)
admin.site.register(Notification)
admin.site.register(AuditLog)
admin.site.register(PortalSetting)

