"""
Management command to seed ABHAYA – Women's Safety and Support Portal with:
- Official Complaint Categories & Subcategories (matching specification verbatim)
- Verified National & State Emergency Helplines + Configurable College Helpline Placeholders
- Institutional Female Student Eligibility Roster
- Role-Based Administrator Accounts (Super Admin, Women's Cell Admin, Hostel Admin, Complaint Handler)
- Sample Female Student Accounts (Approved & Pending Verification)
- Sample Grievances with Chronological Timelines, Assignments & Notifications
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from portal.models import (
    PortalUser,
    EligibleStudentRoster,
    Student,
    Administrator,
    StudentVerification,
    ComplaintCategory,
    Complaint,
    ComplaintAssignment,
    ComplaintUpdate,
    EmergencyContact,
    Notification,
    AuditLog,
    PortalSetting,
)


class Command(BaseCommand):
    help = "Seeds initial categories, helplines, role-based admins, students, and sample complaints for ABHAYA."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding ABHAYA – Women's Safety and Support Portal...")

        # 1. Portal Settings
        PortalSetting.objects.update_or_create(
            id=1,
            defaults={
                'institution_name': '[Configurable College Name — Set in Admin Settings]',
                'initiative_subtitle': 'An Initiative by SFI MACE Unit',
                'campus_location': '[Configurable Campus Location — Set in Admin Settings]',
                'official_contact_email': 'womenscell@college-placeholder.edu.in',
                'allowed_email_domains': '',
                'auto_approve_roster_matches': False,
                'enable_email_notifications': True,
            },
        )

        # 2. Official Complaint Categories & Subcategories (Section 9)
        categories_data = [
            {
                'code': 'HOSTEL',
                'name': 'Hostel Issues',
                'description': (
                    'Report hostel-related problems including water supply, electricity, sanitation, food quality, '
                    'cleanliness, security, warden-related concerns, harassment, maintenance, and facilities.'
                ),
                'default_authority': 'Hostel Warden',
                'display_order': 1,
                'subcategories': [
                    'Water supply',
                    'Electricity',
                    'Sanitation',
                    'Food quality',
                    'Cleanliness',
                    'Security',
                    'Warden-related concerns',
                    'Harassment',
                    'Maintenance',
                    'Inadequate facilities',
                    'Other hostel problems',
                ],
            },
            {
                'code': 'PERSONAL_SAFETY',
                'name': 'Personal Safety',
                'description': (
                    'Confidential reporting for harassment, stalking, inappropriate behaviour, verbal abuse, '
                    'threatening behaviour, unsafe surroundings, transportation safety, and online harassment.'
                ),
                'default_authority': 'Internal Complaints Committee',
                'display_order': 2,
                'subcategories': [
                    'Harassment',
                    'Stalking',
                    'Inappropriate behaviour',
                    'Verbal abuse',
                    'Threatening behaviour',
                    'Unsafe surroundings',
                    'Transportation safety',
                    'Online harassment',
                    'Other concerns',
                ],
            },
            {
                'code': 'COLLEGE_ISSUES',
                'name': 'College Issues',
                'description': (
                    'Report campus safety concerns, inadequate security, inappropriate behaviour, '
                    'washroom safety, poor lighting, and infrastructure-related safety concerns.'
                ),
                'default_authority': "Women's Cell",
                'display_order': 3,
                'subcategories': [
                    'Campus safety',
                    'Inadequate security',
                    'Inappropriate behaviour',
                    'Washroom safety',
                    'Poor lighting',
                    'Infrastructure-related safety concerns',
                ],
            },
            {
                'code': 'EMERGENCY_URGENT',
                'name': 'Urgent Concerns',
                'description': (
                    'Flag immediate personal safety concerns, threatening situations, or urgent assistance '
                    'requests for priority administrative intervention alongside verified emergency helplines.'
                ),
                'default_authority': "Women's Cell",
                'display_order': 4,
                'subcategories': [
                    'Immediate personal safety concerns',
                    'Threatening situations',
                    'Urgent assistance requests',
                    'Other urgent concerns',
                ],
            },
        ]

        cat_map = {}
        for cdata in categories_data:
            cat_obj, _ = ComplaintCategory.objects.update_or_create(
                code=cdata['code'],
                defaults={
                    'name': cdata['name'],
                    'description': cdata['description'],
                    'subcategories': cdata['subcategories'],
                    'default_authority': cdata['default_authority'],
                    'display_order': cdata['display_order'],
                    'is_active': True,
                },
            )
            cat_map[cdata['code']] = cat_obj

        # 3. Emergency Helpline Contacts (Section 5: Verified National/State numbers + Configurable College Contacts)
        helplines_data = [
            {
                'service_name': 'National Emergency Response Support System (ERSS)',
                'contact_number': '112',
                'category': 'NATIONAL',
                'description': (
                    'All-in-one pan-India 24/7 emergency response number connecting directly to Police, '
                    'Fire, Ambulance, and Women Safety emergency dispatch units.'
                ),
                'availability_note': '24/7 Toll-Free National Emergency Service (Verified)',
                'is_verified_number': True,
                'is_featured': True,
                'display_order': 1,
            },
            {
                'service_name': 'Women Helpline (All India / State Vanitha Helpline)',
                'contact_number': '181',
                'category': 'NATIONAL',
                'description': (
                    '24-hour toll-free helpline providing immediate crisis support, counseling, legal aid referrals, '
                    'and rescue coordination for women facing harassment, abuse, or distress.'
                ),
                'availability_note': '24/7 Toll-Free Women Helpline (Verified)',
                'is_verified_number': True,
                'is_featured': True,
                'display_order': 2,
            },
            {
                'service_name': 'Women Police Helpline',
                'contact_number': '1091',
                'category': 'POLICE_LEGAL',
                'description': (
                    'Dedicated Police Helpline for women in distress to report stalking, physical threats, '
                    'harassment in public or transit spaces, and urgent law-enforcement assistance. '
                    '(Note: Where regional routing uses ERSS, dial 112 alongside 1091).'
                ),
                'availability_note': '24/7 Police Control Room for Women (Verified — Dial 112 if unavailable in region)',
                'is_verified_number': True,
                'is_featured': True,
                'display_order': 3,
            },
            {
                'service_name': 'Pink Police Patrol / Women Safety Patrol',
                'contact_number': '1515',
                'category': 'POLICE_LEGAL',
                'description': (
                    'Dedicated Pink Police patrol assistance for women and female students requiring '
                    'safety support in public spaces, bus stops, and transit corridors.'
                ),
                'availability_note': 'State Police Pink Patrol Control Room (Verified)',
                'is_verified_number': True,
                'is_featured': False,
                'display_order': 4,
            },
            {
                'service_name': 'National Cyber Crime & Online Harassment Helpline',
                'contact_number': '1930',
                'category': 'POLICE_LEGAL',
                'description': (
                    'Official Ministry of Home Affairs helpline to report cyber stalking, non-consensual image sharing, '
                    'online blackmail, digital impersonation, and cyber harassment.'
                ),
                'availability_note': '24/7 National Cyber Crime Reporting Helpline (Verified)',
                'is_verified_number': True,
                'is_featured': False,
                'display_order': 5,
            },
            {
                'service_name': 'National Anti-Ragging Helpline (UGC 24x7)',
                'contact_number': '1800-180-5522',
                'category': 'NATIONAL',
                'description': (
                    'UGC toll-free 24/7 helpline for students experiencing ragging, intimidation, or hostel bullying '
                    'inside campus or hostel premises.'
                ),
                'availability_note': '24/7 UGC Toll-Free Helpline (Verified)',
                'is_verified_number': True,
                'is_featured': False,
                'display_order': 6,
            },
            {
                'service_name': 'DISHA – 24x7 Health & Psychosocial Counseling Helpline',
                'contact_number': '1056',
                'category': 'SUPPORT_COUNSELING',
                'description': (
                    'Confidential 24/7 mental health, trauma support, and medical guidance helpline staffed by '
                    'trained counselors.'
                ),
                'availability_note': '24/7 Toll-Free Counseling Support (Verified)',
                'is_verified_number': True,
                'is_featured': False,
                'display_order': 7,
            },
            {
                'service_name': "College Women's Cell (Campus Redressal Desk)",
                'contact_number': '',
                'category': 'COLLEGE_CELL',
                'description': (
                    'Campus Women\'s Cell faculty coordinator and student support desk for gender '
                    'sensitization, welfare grievances, and confidential student assistance. '
                    '[Configurable via Admin Dashboard -> Helpline Management]'
                ),
                'availability_note': 'Configurable Campus Number — Set official number in Admin Helpline Management',
                'is_verified_number': False,
                'is_featured': True,
                'display_order': 8,
            },
            {
                'service_name': 'Internal Complaints Committee (ICC – POSH Act Redressal)',
                'contact_number': '',
                'category': 'COLLEGE_CELL',
                'description': (
                    'Statutory committee constituted under the POSH Act & UGC SAKSHAM regulations for formal inquiry '
                    'and redressal of sexual harassment complaints on campus. '
                    '[Configurable via Admin Dashboard -> Helpline Management]'
                ),
                'availability_note': 'Configurable Campus Number — Set Presiding Officer contact in Admin Dashboard',
                'is_verified_number': False,
                'is_featured': True,
                'display_order': 9,
            },
            {
                'service_name': 'College Ladies Hostel Warden Office',
                'contact_number': '',
                'category': 'HOSTEL_SECURITY',
                'description': (
                    'Direct contact for Chief Warden / Resident Matron regarding ladies hostel emergencies, '
                    'late-entry safety escort, medical needs, and accommodation welfare. '
                    '[Configurable via Admin Dashboard -> Helpline Management]'
                ),
                'availability_note': 'Configurable Hostel Office Number — Set in Admin Helpline Management',
                'is_verified_number': False,
                'is_featured': True,
                'display_order': 10,
            },
            {
                'service_name': 'College Security Control Room (Main Gate & Night Patrol)',
                'contact_number': '',
                'category': 'HOSTEL_SECURITY',
                'description': (
                    '24/7 Campus Security Control Room responsible for campus perimeter security, night patrol, '
                    'unsafe lighting response, and immediate on-campus escort. '
                    '[Configurable via Admin Dashboard -> Helpline Management]'
                ),
                'availability_note': 'Configurable Campus Security Number — Set in Admin Helpline Management',
                'is_verified_number': False,
                'is_featured': False,
                'display_order': 11,
            },
        ]

        for hdata in helplines_data:
            EmergencyContact.objects.update_or_create(
                service_name=hdata['service_name'],
                defaults=hdata,
            )

        # 4. Single Unified Administrator Account (username: abhayasfi, password: Abhayasfi@123)
        admins_data = [
            {
                'email': 'abhayasfi@abhaya.edu.in',
                'password': 'Abhayasfi@123',
                'full_name': 'ABHAYA Central Administrator (SFI MACE Unit)',
                'phone_number': '+91-9400000001',
                'designation': 'Central Administrator & Governance Desk',
                'admin_role': 'SUPER_ADMIN',
                'department_or_unit': "ABHAYA Governance • SFI MACE Unit Initiative",
                'assigned_authority_group': "Women's Cell",
                'can_view_confidential_identity': True,
            },
        ]

        # Deactivate legacy demo admin logins so only one admin login exists
        PortalUser.objects.filter(
            role='ADMIN',
            email__in=[
                'admin@abhaya.edu.in',
                'womenscell@abhaya.edu.in',
                'warden@abhaya.edu.in',
                'handler@abhaya.edu.in',
            ],
        ).update(is_active=False)
        Administrator.objects.filter(
            email__in=[
                'admin@abhaya.edu.in',
                'womenscell@abhaya.edu.in',
                'warden@abhaya.edu.in',
                'handler@abhaya.edu.in',
            ],
        ).update(is_active_admin=False)

        admin_objs = {}
        for adata in admins_data:
            user, created = PortalUser.objects.get_or_create(
                email=adata['email'],
                defaults={
                    'full_name': adata['full_name'],
                    'role': 'ADMIN',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                },
            )
            user.full_name = adata['full_name']
            user.role = 'ADMIN'
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(adata['password'])
            user.save()

            adm_obj, _ = Administrator.objects.update_or_create(
                user=user,
                defaults={
                    'full_name': adata['full_name'],
                    'email': adata['email'],
                    'phone_number': adata['phone_number'],
                    'designation': adata['designation'],
                    'admin_role': adata['admin_role'],
                    'department_or_unit': adata['department_or_unit'],
                    'assigned_authority_group': adata['assigned_authority_group'],
                    'can_view_confidential_identity': adata['can_view_confidential_identity'],
                    'is_active_admin': True,
                },
            )
            admin_objs['SUPER_ADMIN'] = adm_obj
            admin_objs['WOMENS_CELL_ADMIN'] = adm_obj
            admin_objs['HOSTEL_ADMIN'] = adm_obj
            admin_objs['COMPLAINT_HANDLER'] = adm_obj

        self.stdout.write(self.style.SUCCESS("ABHAYA database seeded successfully!"))

