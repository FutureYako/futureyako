from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .models import PlatformSettings


class MaintenanceModeMiddleware(MiddlewareMixin):
    """Middleware to enforce maintenance mode."""
    
    def process_request(self, request):
        """Check if maintenance mode is enabled and block non-admin requests."""
        try:
            settings = PlatformSettings.get_solo()
            if settings.maintenance_mode_enabled:
                # Allow admin users and auth endpoints during maintenance
                if (
                    not request.user.is_authenticated 
                    or not request.user.is_staff
                ) and not request.path.startswith('/api/'):
                    return JsonResponse(
                        {'detail': 'Platform under maintenance.'}, 
                        status=503
                    )
        except Exception:
            # If settings don't exist yet, allow request
            pass
        
        return None
