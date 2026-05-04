from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        payload = {
            "detail": _extract_detail(response.data),
            "status_code": response.status_code,
        }
        if isinstance(response.data, dict):
            field_errors = {
                k: v for k, v in response.data.items()
                if k not in ("detail", "non_field_errors")
            }
            if field_errors:
                payload["field_errors"] = field_errors
        response.data = payload

    return response


def _extract_detail(data):
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        if "non_field_errors" in data:
            return str(data["non_field_errors"][0])
        return "Validation error."
    if isinstance(data, list):
        return str(data[0])
    return str(data)


class ServiceError(Exception):
    """Raise from service/business-logic layer to propagate to views."""

    def __init__(self, message, code=status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.code = code
        super().__init__(message)
