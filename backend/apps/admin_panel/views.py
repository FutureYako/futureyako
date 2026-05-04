from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Sum
from django.utils import timezone
from .models import (
    PlatformSettings, SystemAlert, AdminActivityLog, 
    MonthlyStats, SystemHealth
)
from .serializers import (
    PlatformSettingsSerializer, SystemAlertSerializer,
    AdminActivityLogSerializer, MonthlyStatsSerializer,
    SystemHealthSerializer, OverviewStatsSerializer,
    UserManagementSerializer, ChartDataSerializer
)
from apps.accounts.models import User
from apps.transactions.models import WithdrawalRequest
from apps.investments.models import InvestmentFund
from apps.investments.serializers import InvestmentFundSerializer
from apps.transactions.serializers import WithdrawalRequestSerializer


# Overview endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def overview_stats(request):
    """Get admin overview statistics."""
    
    serializer = OverviewStatsSerializer(
        instance={},
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def chart_data(request):
    """Get chart data for admin dashboard."""

    serializer = ChartDataSerializer(
        instance={},
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


# User management endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_management(request):
    """Get user management data with filtering."""
    
    search = request.GET.get('search', '')
    status_filter = request.GET.get('status', '')
    
    serializer = UserManagementSerializer(
        instance={},
        context={
            'request': request,
            'search': search,
            'status': status_filter
        }
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_detail(request, user_id):
    """Get detailed information about a specific user."""
    
    user = get_object_or_404(User, id=user_id)
    
    # Get user statistics
    from apps.wallets.models import Wallet
    from apps.goals.models import Goal
    from apps.investments.models import Investment
    from apps.transactions.models import Transaction
    
    wallet = Wallet.objects.filter(user=user).first()
    goals = Goal.objects.filter(user=user)
    investments = Investment.objects.filter(user=user)
    transactions = Transaction.objects.filter(user=user)
    
    data = {
        'user': {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name,
            'phone_number': user.phone_number,
            'member_status': user.member_status,
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'location': user.location,
            'bio': user.bio,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_staff': user.is_staff,
        },
        'wallet': {
            'wallet_number': wallet.wallet_number if wallet else None,
            'total_balance': float(wallet.total_balance) if wallet else 0.0,
            'available_balance': float(wallet.available_balance) if wallet else 0.0,
            'status': wallet.status if wallet else None,
        },
        'goals': {
            'total_count': goals.count(),
            'active_count': goals.filter(status='active').count(),
            'completed_count': goals.filter(status='completed').count(),
            'total_amount': float(goals.aggregate(
                total=Sum('current')
            )['total'] or 0),
        },
        'investments': {
            'total_count': investments.count(),
            'active_count': investments.filter(status='active').count(),
            'total_invested': float(investments.aggregate(
                total=Sum('amount_invested')
            )['total'] or 0),
            'current_value': float(investments.aggregate(
                total=Sum('current_value')
            )['total'] or 0),
        },
        'transactions': {
            'total_count': transactions.count(),
            'completed_count': transactions.filter(status='completed').count(),
            'total_amount': float(transactions.filter(status='completed').aggregate(
                total=Sum('net_amount')
            )['total'] or 0),
        }
    }
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def suspend_user(request, user_id):
    """Suspend a user account."""
    
    user = get_object_or_404(User, id=user_id)
    
    if user.member_status == 'suspended':
        return Response(
            {'error': 'User is already suspended.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log admin action
    AdminActivityLog.objects.create(
        admin_user=request.user,
        action='user_suspend',
        target_user=user,
        details={'previous_status': user.member_status},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    user.member_status = 'suspended'
    user.save()
    
    return Response({
        'message': 'User suspended successfully.',
        'user_id': str(user.id)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def activate_user(request, user_id):
    """Activate a user account."""
    
    user = get_object_or_404(User, id=user_id)
    
    if user.member_status == 'active':
        return Response(
            {'error': 'User is already active.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log admin action
    AdminActivityLog.objects.create(
        admin_user=request.user,
        action='user_activate',
        target_user=user,
        details={'previous_status': user.member_status},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    user.member_status = 'active'
    user.save()
    
    return Response({
        'message': 'User activated successfully.',
        'user_id': str(user.id)
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def delete_user(request, user_id):
    """Delete a user account."""
    
    user = get_object_or_404(User, id=user_id)
    
    # Log admin action
    AdminActivityLog.objects.create(
        admin_user=request.user,
        action='user_delete',
        target_user=user,
        details={'email': user.email},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    user.delete()
    
    return Response({
        'message': 'User deleted successfully.',
        'user_id': str(user_id)
    }, status=status.HTTP_200_OK)


# Investment fund management
class InvestmentFundListCreateView(generics.ListCreateAPIView):
    """List and create investment funds (admin only)."""
    
    serializer_class = InvestmentFundSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'risk_level', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'annual_roi', 'min_investment']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return InvestmentFund.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Create fund and log admin action."""
        response = super().create(request, *args, **kwargs)
        
        # Log admin action
        AdminActivityLog.objects.create(
            admin_user=request.user,
            action='fund_create',
            target_object_id=str(response.data['id']),
            target_object_type='InvestmentFund',
            details={'fund_name': response.data['name']},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return response


class InvestmentFundDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete investment funds (admin only)."""
    
    serializer_class = InvestmentFundSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return InvestmentFund.objects.all()
    
    def update(self, request, *args, **kwargs):
        """Update fund and log admin action."""
        response = super().update(request, *args, **kwargs)
        
        # Log admin action
        AdminActivityLog.objects.create(
            admin_user=request.user,
            action='fund_update',
            target_object_id=str(kwargs['pk']),
            target_object_type='InvestmentFund',
            details={'fund_name': response.data['name']},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Delete fund and log admin action."""
        fund = self.get_object()
        fund_name = fund.name
        
        response = super().destroy(request, *args, **kwargs)
        
        # Log admin action
        AdminActivityLog.objects.create(
            admin_user=request.user,
            action='fund_delete',
            target_object_id=str(kwargs['pk']),
            target_object_type='InvestmentFund',
            details={'fund_name': fund_name},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return response


# Withdrawal management
class WithdrawalRequestListView(generics.ListAPIView):
    """List all withdrawal requests (admin only)."""
    
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'withdrawal_method']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return WithdrawalRequest.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_withdrawal(request, withdrawal_id):
    """Approve a withdrawal request."""
    
    withdrawal = get_object_or_404(WithdrawalRequest, id=withdrawal_id)
    
    if withdrawal.status != 'pending':
        return Response(
            {'error': 'Withdrawal request is not pending.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log admin action
    AdminActivityLog.objects.create(
        admin_user=request.user,
        action='withdrawal_approve',
        target_user=withdrawal.user,
        target_object_id=str(withdrawal.id),
        target_object_type='WithdrawalRequest',
        details={'amount': float(withdrawal.amount)},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    withdrawal.approve(request.user)
    
    return Response({
        'message': 'Withdrawal approved successfully.',
        'withdrawal_id': str(withdrawal.id)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_withdrawal(request, withdrawal_id):
    """Reject a withdrawal request."""
    
    withdrawal = get_object_or_404(WithdrawalRequest, id=withdrawal_id)
    reason = request.data.get('reason', 'Rejected by admin')
    
    if withdrawal.status != 'pending':
        return Response(
            {'error': 'Withdrawal request is not pending.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log admin action
    AdminActivityLog.objects.create(
        admin_user=request.user,
        action='withdrawal_reject',
        target_user=withdrawal.user,
        target_object_id=str(withdrawal.id),
        target_object_type='WithdrawalRequest',
        details={'amount': float(withdrawal.amount), 'reason': reason},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    withdrawal.reject(request.user, reason)
    
    return Response({
        'message': 'Withdrawal rejected successfully.',
        'withdrawal_id': str(withdrawal.id)
    }, status=status.HTTP_200_OK)


# Platform settings
class PlatformSettingsDetailView(generics.RetrieveUpdateAPIView):
    """Get or update platform settings (admin only)."""
    
    serializer_class = PlatformSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_object(self):
        return PlatformSettings.get_solo()
    
    def update(self, request, *args, **kwargs):
        """Update settings and log admin action."""
        response = super().update(request, *args, **kwargs)
        
        # Log admin action
        AdminActivityLog.objects.create(
            admin_user=request.user,
            action='settings_update',
            details=response.data,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return response


# System alerts
class SystemAlertListCreateView(generics.ListCreateAPIView):
    """List and create system alerts (admin only)."""
    
    serializer_class = SystemAlertSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['level', 'is_active']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return SystemAlert.objects.all()


class SystemAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete system alerts (admin only)."""
    
    serializer_class = SystemAlertSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return SystemAlert.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dismiss_alert(request, alert_id):
    """Dismiss a system alert."""
    
    alert = get_object_or_404(SystemAlert, id=alert_id)
    
    if not alert.is_active:
        return Response(
            {'error': 'Alert is already dismissed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log admin action
    AdminActivityLog.objects.create(
        admin_user=request.user,
        action='alert_dismiss',
        target_object_id=str(alert.id),
        target_object_type='SystemAlert',
        details={'alert_title': alert.title},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    alert.dismiss(request.user)
    
    return Response({
        'message': 'Alert dismissed successfully.',
        'alert_id': str(alert.id)
    }, status=status.HTTP_200_OK)


# Activity logs
class AdminActivityLogListView(generics.ListAPIView):
    """List admin activity logs (admin only)."""
    
    serializer_class = AdminActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'admin_user', 'target_user']
    search_fields = [
        'admin_user__email', 'target_user__email', 
        'target_object_id', 'details'
    ]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AdminActivityLog.objects.all()


# Monthly stats
class MonthlyStatsListView(generics.ListAPIView):
    """List monthly statistics (admin only)."""
    
    serializer_class = MonthlyStatsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['year', 'month']
    ordering_fields = ['year', 'month']
    ordering = ['-year', '-month']
    
    def get_queryset(self):
        return MonthlyStats.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def generate_monthly_stats(request):
    """Generate current month statistics."""

    stats = MonthlyStats.generate_current_month_stats()
    serializer = MonthlyStatsSerializer(stats)

    return Response(serializer.data, status=status.HTTP_201_CREATED)


# Make / revoke admin
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def make_admin(request, user_id):
    user = get_object_or_404(User, id=user_id)
    if user.is_superuser:
        return Response({'error': 'Cannot modify superuser.'}, status=status.HTTP_400_BAD_REQUEST)
    user.is_staff = True
    user.save()
    AdminActivityLog.objects.create(
        admin_user=request.user, action='make_admin', target_user=user,
        ip_address=request.META.get('REMOTE_ADDR'), user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    return Response({'message': 'Admin privileges granted.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def revoke_admin(request, user_id):
    user = get_object_or_404(User, id=user_id)
    if user.is_superuser:
        return Response({'error': 'Cannot modify superuser.'}, status=status.HTTP_400_BAD_REQUEST)
    user.is_staff = False
    user.save()
    AdminActivityLog.objects.create(
        admin_user=request.user, action='revoke_admin', target_user=user,
        ip_address=request.META.get('REMOTE_ADDR'), user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    return Response({'message': 'Admin privileges revoked.'}, status=status.HTTP_200_OK)


# Admin goals list
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_goals(request):
    from apps.goals.models import Goal
    from django.core.paginator import Paginator

    qs = Goal.objects.select_related('user').order_by('-created_at')
    goal_type = request.GET.get('goal_type')
    status_filter = request.GET.get('status')
    search = request.GET.get('search', '')
    if goal_type:
        qs = qs.filter(type=goal_type)
    if status_filter:
        qs = qs.filter(status=status_filter)
    if search:
        from django.db.models import Q
        qs = qs.filter(Q(name__icontains=search) | Q(user__full_name__icontains=search) | Q(user__email__icontains=search))

    page_num = int(request.GET.get('page', 1))
    paginator = Paginator(qs, 20)
    page = paginator.get_page(page_num)

    data = []
    for g in page.object_list:
        data.append({
            'id': str(g.id),
            'name': g.name,
            'goal_type': g.type,
            'target_amount': float(g.target),
            'current_amount': float(g.current),
            'status': g.status,
            'deadline': g.deadline.isoformat() if g.deadline else None,
            'created_at': g.created_at.isoformat(),
            'user_name': g.user.full_name or g.user.email,
            'user_email': g.user.email,
        })
    return Response({'results': data, 'count': paginator.count}, status=status.HTTP_200_OK)


# Admin transactions list
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_transactions(request):
    from apps.transactions.models import Transaction
    from django.core.paginator import Paginator
    from django.db.models import Q

    qs = Transaction.objects.select_related('user').order_by('-created_at')
    txn_type = request.GET.get('transaction_type')
    status_filter = request.GET.get('status')
    search = request.GET.get('search', '')
    if txn_type:
        qs = qs.filter(transaction_type__iexact=txn_type)
    if status_filter:
        qs = qs.filter(status=status_filter)
    if search:
        qs = qs.filter(
            Q(user__full_name__icontains=search) |
            Q(user__email__icontains=search) |
            Q(reference_number__icontains=search)
        )

    page_num = int(request.GET.get('page', 1))
    paginator = Paginator(qs, 20)
    page = paginator.get_page(page_num)

    data = []
    for t in page.object_list:
        data.append({
            'id': str(t.id),
            'user_name': t.user.full_name or t.user.email,
            'user_email': t.user.email,
            'transaction_type': t.transaction_type,
            'amount': float(t.amount),
            'net_amount': float(t.net_amount),
            'status': t.status,
            'reference_number': t.reference_number,
            'created_at': t.created_at.isoformat(),
        })
    return Response({'results': data, 'count': paginator.count}, status=status.HTTP_200_OK)


# Broadcast notifications
class BroadcastListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def list(self, request, *args, **kwargs):
        from apps.notifications.models import BroadcastMessage
        qs = BroadcastMessage.objects.order_by('-created_at')[:20]
        data = [
            {
                'id': str(b.id),
                'title': b.title,
                'message': b.message,
                'notif_type': b.notif_type,
                'target_audience': b.target_audience,
                'reach_count': b.reach_count,
                'sent_at': b.sent_at.isoformat() if b.sent_at else b.created_at.isoformat(),
                'created_at': b.created_at.isoformat(),
            }
            for b in qs
        ]
        return Response(data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        from apps.notifications.models import BroadcastMessage

        title = request.data.get('title', '')
        message = request.data.get('message', '')
        notif_type = request.data.get('notif_type', 'info')
        target_audience = request.data.get('target_audience', 'all')

        if not title or not message:
            return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        broadcast = BroadcastMessage.objects.create(
            title=title,
            message=message,
            notif_type=notif_type,
            target_audience=target_audience,
            created_by=request.user,
        )
        broadcast.send_broadcast()

        return Response({
            'id': str(broadcast.id),
            'title': broadcast.title,
            'message': broadcast.message,
            'notif_type': broadcast.notif_type,
            'target_audience': broadcast.target_audience,
            'reach_count': broadcast.reach_count,
            'sent_at': broadcast.sent_at.isoformat(),
            'created_at': broadcast.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


# Payment providers (banks + mobile)
class PaymentProviderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def _model(self):
        from apps.admin_panel.models import PaymentProvider
        return PaymentProvider

    def get_queryset(self):
        provider_type = self.kwargs.get('provider_type')
        return self._model().objects.filter(provider_type=provider_type)

    def get_serializer_class(self):
        from apps.admin_panel.serializers import PaymentProviderSerializer
        return PaymentProviderSerializer

    def perform_create(self, serializer):
        serializer.save(provider_type=self.kwargs.get('provider_type'))


class PaymentProviderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        from apps.admin_panel.models import PaymentProvider
        return PaymentProvider.objects.all()

    def get_serializer_class(self):
        from apps.admin_panel.serializers import PaymentProviderSerializer
        return PaymentProviderSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def public_payment_providers(request, provider_type):
    """Return active payment providers of a given type for any authenticated user."""
    from apps.admin_panel.models import PaymentProvider
    providers = PaymentProvider.objects.filter(provider_type=provider_type, is_active=True).order_by('name')
    data = [{'id': str(p.id), 'name': p.name, 'code': p.code} for p in providers]
    return Response(data)
