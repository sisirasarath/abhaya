"""Custom exception handler for consistent JSON error responses across ABHAYA APIs."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data
        message = None
        if isinstance(detail, dict):
            if 'detail' in detail:
                message = str(detail['detail'])
            elif 'non_field_errors' in detail:
                errs = detail['non_field_errors']
                message = str(errs[0]) if isinstance(errs, list) and errs else str(errs)
            else:
                first_key = next(iter(detail.keys()), None)
                if first_key:
                    val = detail[first_key]
                    if isinstance(val, list) and val:
                        message = f"{first_key}: {val[0]}"
                    else:
                        message = f"{first_key}: {val}"
        elif isinstance(detail, list) and detail:
            message = str(detail[0])

        response.data = {
            'error': True,
            'status_code': response.status_code,
            'message': message or 'Request validation or authorization error.',
            'details': detail,
        }
        return response

    return Response(
        {
            'error': True,
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'message': 'An unexpected server error occurred. Please try again.',
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

