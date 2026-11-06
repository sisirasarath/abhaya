"""
Comprehensive End-to-End Backend API Test Suite for ABHAYA – Women's Safety and Support Portal.
Verifies all 12 required security, RBAC, confidentiality, verification, and workflow scenarios.
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.core.management import call_command

from .models import Student, Complaint, EmergencyContact


class AbhayaPortalWorkflowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_abhaya')

    def setUp(self):
        self.client = APIClient()

    def test_01_public_overview_and_helplines_without_login(self):
        """Scenarios 1 & 2: Public visitor can access overview and emergency helplines without login."""
        res_overview = self.client.get('/api/public/overview/')
        self.assertEqual(res_overview.status_code, status.HTTP_200_OK)
        self.assertIn('helplines', res_overview.data)
        self.assertIn('categories', res_overview.data)

        res_helplines = self.client.get('/api/public/helplines/')
        self.assertEqual(res_helplines.status_code, status.HTTP_200_OK)
        numbers = [h['contact_number'] for h in res_helplines.data['results']]
        self.assertIn('112', numbers)
        self.assertIn('181', numbers)
        self.assertIn('1091', numbers)

    def test_02_unverified_student_cannot_login_or_access_dashboard(self):
        """Scenario 3: Pending / unverified student registration is blocked from logging in."""
        res_reg = self.client.post(
            '/api/auth/student/register/',
            {
                'full_name': 'Meenakshi V',
                'email': 'meenakshi@college.edu.in',
                'admission_number': 'CET25EC099',
                'department': 'Electronics & Communication',
                'year_semester': 'S1/S2 (1st Year)',
                'phone_number': '+91-9847099887',
                'residence_type': 'HOSTEL',
                'hostel_name': 'Ladies Hostel Block A (Nila)',
                'password': 'SecurePassword@123',
                'confirm_password': 'SecurePassword@123',
            },
            format='json',
        )
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg.data['verification_status'], 'PENDING')

        res_login = self.client.post(
            '/api/auth/student/login/',
            {'email': 'meenakshi@college.edu.in', 'password': 'SecurePassword@123'},
            format='json',
        )
        self.assertEqual(res_login.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_login.data['account_status'], 'PENDING')

    def test_03_approved_student_login_and_complaint_submission(self):
        """Scenarios 4, 5, 6: Approved student logs in, submits complaint, stored in DB."""
        res_login = self.client.post(
            '/api/auth/student/login/',
            {'email': 'ananya@college.edu.in', 'password': 'StudentPassword@123'},
            format='json',
        )
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        token = res_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        res_create = self.client.post(
            '/api/student/complaints/',
            {
                'title': 'Stalking incident near Main Gate Bus Waiting Shed',
                'category_code': 'PERSONAL_SAFETY',
                'subcategory': 'Stalking',
                'description': 'Experienced repeated following near the evening college bus stop around 5:45 PM.',
                'incident_location': 'Main Gate Bus Waiting Shed',
                'incident_date': str(timezone.localdate()),
                'incident_time': '05:45 PM',
                'is_currently_occurring': False,
                'immediate_assistance_required': False,
                'preferred_contact_method': 'PORTAL_ONLY',
                'confidentiality_preference': 'CONFIDENTIAL',
            },
            format='json',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        cid = res_create.data['complaint_id']
        self.assertTrue(cid.startswith('ABH-'))
        self.assertTrue(Complaint.objects.filter(complaint_id=cid).exists())

    def test_04_cross_student_complaint_isolation(self):
        """Scenario 10: A student must NEVER be able to view another student's complaint."""
        # Gowri logs in and attempts to access Ananya's complaint
        ananya_complaint = Complaint.objects.filter(student__email='ananya@college.edu.in').first()
        res_login = self.client.post(
            '/api/auth/student/login/',
            {'email': 'gowri@college.edu.in', 'password': 'StudentPassword@123'},
            format='json',
        )
        token = res_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        res_forbidden = self.client.get(f"/api/student/complaints/{ananya_complaint.complaint_id}/")
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

    def test_05_admin_rbac_confidentiality_and_status_updates(self):
        """Scenarios 7, 8, 9, 11: Admin views, assigns, updates complaint; RBAC & confidentiality enforced."""
        # Hostel Admin logs in
        res_warden = self.client.post(
            '/api/auth/admin/login/',
            {'email': 'warden@abhaya.edu.in', 'password': 'AdminPassword@123'},
            format='json',
        )
        self.assertEqual(res_warden.status_code, status.HTTP_200_OK)
        warden_token = res_warden.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {warden_token}")

        # Hostel Admin checks a CONFIDENTIAL hostel complaint -> student identity MUST be redacted in backend!
        conf_hostel = Complaint.objects.filter(
            category_code='HOSTEL',
            confidentiality_preference='CONFIDENTIAL',
        ).first()
        res_detail = self.client.get(f"/api/admin/complaints/{conf_hostel.complaint_id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertTrue(res_detail.data['complaint']['identity_is_redacted'])
        self.assertEqual(
            res_detail.data['complaint']['student_info']['email'],
            '[REDACTED — CONFIDENTIAL]',
        )

        # Hostel Admin updates status + adds internal note + adds public update
        res_internal = self.client.post(
            f"/api/admin/complaints/{conf_hostel.complaint_id}/update-status/",
            {
                'status': 'UNDER_REVIEW',
                'message': 'PRIVATE INTERNAL WARDEN NOTE: Plumber called at 9 AM.',
                'is_internal': True,
            },
            format='json',
        )
        self.assertEqual(res_internal.status_code, status.HTTP_200_OK)

        res_public = self.client.post(
            f"/api/admin/complaints/{conf_hostel.complaint_id}/update-status/",
            {
                'status': 'ACTION_IN_PROGRESS',
                'message': 'Water purifier filter cartridge is being replaced today.',
                'is_internal': False,
            },
            format='json',
        )
        self.assertEqual(res_public.status_code, status.HTTP_200_OK)

        # Now Student logs in and checks complaint timeline -> sees ACTION_IN_PROGRESS, does NOT see internal note
        res_stu = self.client.post(
            '/api/auth/student/login/',
            {'email': 'ananya@college.edu.in', 'password': 'StudentPassword@123'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res_stu.data['access']}")
        res_stu_view = self.client.get(f"/api/student/complaints/{conf_hostel.complaint_id}/")
        self.assertEqual(res_stu_view.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stu_view.data['status'], 'ACTION_IN_PROGRESS')
        messages = [u['message'] for u in res_stu_view.data['updates']]
        self.assertIn('Water purifier filter cartridge is being replaced today.', messages)
        for m in messages:
            self.assertNotIn('PRIVATE INTERNAL WARDEN NOTE', m)

    def test_06_admin_helpline_update_reflects_publicly(self):
        """Scenario 12: Changes to emergency contact information appear immediately on public website."""
        res_admin = self.client.post(
            '/api/auth/admin/login/',
            {'email': 'admin@abhaya.edu.in', 'password': 'AdminPassword@123'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res_admin.data['access']}")

        womens_cell = EmergencyContact.objects.filter(
            service_name__icontains="College Women's Cell"
        ).first()
        res_patch = self.client.patch(
            f"/api/admin/helplines/{womens_cell.id}/",
            {
                'contact_number': '0471-2515502',
                'is_verified_number': True,
            },
            format='json',
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)

        # Public visitor fetches helplines without auth
        self.client.credentials()
        res_pub = self.client.get('/api/public/helplines/')
        updated = next(
            h for h in res_pub.data['results'] if h['id'] == womens_cell.id
        )
        self.assertEqual(updated['contact_number'], '0471-2515502')
        self.assertTrue(updated['is_verified_number'])
