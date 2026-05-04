from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import InvestmentFund, Investment, PortfolioSnapshot
from .serializers import (
    InvestmentFundSerializer,
    InvestmentReviewSerializer,
    InvestmentSerializer,
    InvestmentCreateSerializer,
    PortfolioSummarySerializer,
    PortfolioAllocationSerializer,
    PortfolioSnapshotSerializer
)


class InvestmentFundListView(generics.ListAPIView):
    """List available investment funds."""
    
    serializer_class = InvestmentFundSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'risk_level', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['annual_roi', 'min_investment', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return InvestmentFund.objects.filter(is_active=True)


class InvestmentFundDetailView(generics.RetrieveAPIView):
    """Retrieve investment fund details."""
    
    serializer_class = InvestmentFundSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return InvestmentFund.objects.filter(is_active=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_investment(request):
    """Preview investment returns without creating the investment."""
    
    serializer = InvestmentReviewSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    projections = serializer.calculate_projections()
    return Response(projections, status=status.HTTP_200_OK)


class InvestmentListCreateView(generics.ListCreateAPIView):
    """List and create investments for the authenticated user."""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fund', 'status']
    search_fields = ['reference_number', 'fund__name']
    ordering_fields = ['created_at', 'amount_invested', 'current_value']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Investment.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvestmentCreateSerializer
        return InvestmentSerializer


class InvestmentDetailView(generics.RetrieveAPIView):
    """Retrieve investment details."""
    
    serializer_class = InvestmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Investment.objects.filter(user=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_summary(request):
    """Get aggregated portfolio summary."""
    
    serializer = PortfolioSummarySerializer(
        instance={},
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_allocation(request):
    """Get portfolio allocation breakdown by category."""

    serializer = PortfolioAllocationSerializer(
        instance={},
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_returns(request):
    """Get monthly return series for portfolio."""
    
    user = request.user
    period = request.GET.get('period', '6M')  # Default to 6 months
    
    # Get portfolio snapshots for the period
    snapshots = PortfolioSnapshot.objects.filter(user=user)
    
    # Filter by period (simplified - in production, you'd parse the period string)
    if period == '1Y':
        snapshots = snapshots[:12]  # Last 12 snapshots
    else:
        snapshots = snapshots[:6]   # Last 6 snapshots
    
    serializer = PortfolioSnapshotSerializer(snapshots, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_portfolio_snapshot(request):
    """Create a daily portfolio snapshot (for testing/scheduled tasks)."""
    
    user = request.user
    snapshot = PortfolioSnapshot.create_snapshot(user)
    
    serializer = PortfolioSnapshotSerializer(snapshot)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
