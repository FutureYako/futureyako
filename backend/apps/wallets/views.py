from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import ProtectedError
from .models import Wallet, FundingSource
from .serializers import (
    WalletSerializer, 
    FundingSourceSerializer,
    FundingSourceCreateSerializer,
    FundingSourceUpdateSerializer
)


class WalletDetailView(generics.RetrieveAPIView):
    """Get current user's wallet information."""
    
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        wallet, created = Wallet.objects.get_or_create(user=user)
        return wallet


class FundingSourceListCreateView(generics.ListCreateAPIView):
    """List and create funding sources for the authenticated user."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return FundingSource.objects.filter(wallet__user=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FundingSourceCreateSerializer
        return FundingSourceSerializer


class FundingSourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific funding source."""
    
    serializer_class = FundingSourceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        funding_source = get_object_or_404(
            FundingSource, 
            id=self.kwargs['pk'],
            wallet__user=user
        )
        return funding_source
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return FundingSourceUpdateSerializer
        return FundingSourceSerializer

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            from rest_framework.exceptions import APIException
            raise APIException(
                detail="This funding source cannot be deleted because it has associated deduction history. You can unlink it from your auto-save settings instead.",
                code="protected_reference",
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_primary_funding_source(request, pk):
    """Set a funding source as the primary source."""
    
    user = request.user
    funding_source = get_object_or_404(
        FundingSource, 
        id=pk,
        wallet__user=user
    )
    
    # Reset all other sources to non-primary
    FundingSource.objects.filter(
        wallet__user=user
    ).update(is_primary=False)
    
    # Set this source as primary
    funding_source.is_primary = True
    funding_source.save()
    
    serializer = FundingSourceSerializer(funding_source)
    return Response(serializer.data, status=status.HTTP_200_OK)
