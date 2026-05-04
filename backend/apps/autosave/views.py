from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from common.utils import compute_next_deduction
from .models import SavingPreference, DeductionLog, GoalWeight, OnboardingProgress
from .serializers import (
    SavingPreferenceSerializer,
    SavingPreferenceUpdateSerializer,
    DeductionLogSerializer,
    GoalWeightSerializer,
    GoalWeightCreateSerializer,
    OnboardingProgressSerializer
)


class SavingPreferenceDetailView(generics.RetrieveUpdateAPIView):
    """Get or update user's saving preferences."""
    
    serializer_class = SavingPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        preference, created = SavingPreference.objects.get_or_create(
            user=user,
            defaults={
                'amount': Decimal('100.00'),
                'amount_type': 'Fixed Amount',
                'frequency': 'Monthly',
                'duration_months': 6,
            }
        )
        return preference
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return SavingPreferenceUpdateSerializer
        return SavingPreferenceSerializer


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_autosave(request):
    """Enable or disable auto-save for the user."""
    
    user = request.user
    preference, created = SavingPreference.objects.get_or_create(user=user)
    
    preference.is_enabled = not preference.is_enabled
    preference.save()
    
    serializer = SavingPreferenceSerializer(preference, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


class DeductionLogListView(generics.ListAPIView):
    """List deduction history for the authenticated user."""
    
    serializer_class = DeductionLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'funding_source']
    ordering_fields = ['created_at', 'scheduled_at', 'executed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return DeductionLog.objects.filter(user=user)


class GoalWeightListCreateView(generics.ListCreateAPIView):
    """List and create goal weight allocations."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return GoalWeight.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GoalWeightCreateSerializer
        return GoalWeightSerializer


class GoalWeightDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete goal weight allocation."""
    
    serializer_class = GoalWeightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return GoalWeight.objects.filter(user=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def onboarding_status(request):
    """Get user's onboarding progress status."""
    
    user = request.user
    progress, created = OnboardingProgress.objects.get_or_create(user=user)
    
    serializer = OnboardingProgressSerializer(progress)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_onboarding_step(request):
    """Update specific onboarding step completion."""
    
    user = request.user
    progress, created = OnboardingProgress.objects.get_or_create(user=user)
    
    step = request.data.get('step')
    completed = request.data.get('completed', True)
    
    valid_steps = ['funding_source_added', 'goals_created', 'autosave_configured']
    if step not in valid_steps:
        return Response(
            {'error': f'Invalid step. Must be one of: {valid_steps}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    setattr(progress, step, completed)
    progress.update_progress()
    
    serializer = OnboardingProgressSerializer(progress)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def autosave_summary(request):
    """Get summary of auto-save settings and performance."""
    
    user = request.user
    
    try:
        preference = user.saving_preference
    except SavingPreference.DoesNotExist:
        return Response({
            'configured': False,
            'message': 'Auto-save not configured yet.'
        }, status=status.HTTP_200_OK)
    
    # Get recent deduction logs
    recent_logs = DeductionLog.objects.filter(
        user=user
    ).order_by('-created_at')[:10]
    
    # Calculate statistics
    total_deductions = DeductionLog.objects.filter(
        user=user, 
        status='completed'
    ).count()
    
    total_amount = DeductionLog.objects.filter(
        user=user,
        status='completed'
    ).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    failed_deductions = DeductionLog.objects.filter(
        user=user, 
        status='failed'
    ).count()
    
    return Response({
        'configured': True,
        'preference': SavingPreferenceSerializer(
            preference, 
            context={'request': request}
        ).data,
        'statistics': {
            'total_deductions': total_deductions,
            'total_amount': total_amount,
            'failed_deductions': failed_deductions,
            'success_rate': (
                (total_deductions / (total_deductions + failed_deductions) * 100)
                if (total_deductions + failed_deductions) > 0 else 0
            )
        },
        'recent_activity': DeductionLogSerializer(recent_logs, many=True).data
    }, status=status.HTTP_200_OK)
