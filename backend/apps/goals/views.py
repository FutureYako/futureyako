from decimal import Decimal
from datetime import date
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from common.permissions import IsOwner, IsGroupCreator, IsGroupMember
from .models import Goal, GroupParticipant, WithdrawalRequest, WithdrawalVote
from .serializers import (
    GoalSerializer, 
    GoalCreateSerializer,
    GroupParticipantSerializer,
    WithdrawalRequestSerializer,
    WithdrawalVoteSerializer,
    GoalJoinSerializer
)


class GoalListCreateView(generics.ListCreateAPIView):
    """List and create goals for the authenticated user."""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'deadline', 'target']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Goal.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GoalCreateSerializer
        return GoalSerializer


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific goal."""
    
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        user = self.request.user
        return Goal.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return GoalCreateSerializer
        return GoalSerializer


class GroupParticipantListView(generics.ListAPIView):
    """List participants in a group goal."""
    
    serializer_class = GroupParticipantSerializer
    permission_classes = [IsAuthenticated, IsGroupMember]
    
    def get_queryset(self):
        goal_id = self.kwargs['goal_id']
        return GroupParticipant.objects.filter(goal_id=goal_id)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_group_goal(request):
    """Join a group goal using invitation code."""
    
    serializer = GoalJoinSerializer(
        data=request.data, 
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    goal = serializer.goal
    user = request.user
    
    # Create participant record
    participant = GroupParticipant.objects.create(
        goal=goal,
        user=user,
        is_creator=False
    )
    
    # Return goal details
    goal_serializer = GoalSerializer(goal, context={'request': request})
    return Response({
        'message': 'Successfully joined the group goal.',
        'goal': goal_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsGroupCreator])
def invite_to_group_goal(request, goal_id):
    """Generate and send invitation link for group goal."""
    
    goal = get_object_or_404(Goal, id=goal_id, type='group')
    
    # Generate invitation link (frontend will handle actual sending)
    invitation_link = f"{request.build_absolute_uri('/goals/join/')}?code={goal.invitation_code}"
    
    return Response({
        'invitation_code': goal.invitation_code,
        'invitation_link': invitation_link
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsGroupCreator])
def remove_group_participant(request, goal_id, user_id):
    """Remove a participant from group goal (creator only)."""
    
    goal = get_object_or_404(Goal, id=goal_id, type='group')
    participant = get_object_or_404(
        GroupParticipant, 
        goal=goal, 
        user_id=user_id
    )
    
    # Don't allow removing the creator
    if participant.is_creator:
        return Response(
            {'error': 'Cannot remove the goal creator.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    participant.delete()
    
    return Response(
        {'message': 'Participant removed successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsGroupMember])
def contribute_to_group_goal(request, goal_id):
    """Contribute to a group goal."""
    
    goal = get_object_or_404(Goal, id=goal_id, type='group')
    user = request.user
    participant = get_object_or_404(GroupParticipant, goal=goal, user=user)
    
    amount = Decimal(str(request.data.get('amount', 0)))
    if amount <= 0:
        return Response(
            {'error': 'Contribution amount must be positive.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update participant contribution
    participant.amount_contributed += amount
    participant.save()
    
    # Update goal current amount
    goal.current += amount
    goal.save()
    
    # Create transaction record (will be implemented in transactions app)
    # Transaction.objects.create(...)
    
    return Response({
        'message': 'Contribution successful.',
        'new_contribution_total': participant.amount_contributed,
        'goal_progress': goal.progress_percentage
    }, status=status.HTTP_200_OK)


class WithdrawalRequestListCreateView(generics.ListCreateAPIView):
    """List and create withdrawal requests for group goals."""
    
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated, IsGroupMember]
    
    def get_queryset(self):
        goal_id = self.kwargs['goal_id']
        return WithdrawalRequest.objects.filter(goal_id=goal_id)


class WithdrawalRequestDetailView(generics.RetrieveAPIView):
    """Retrieve withdrawal request details."""
    
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated, IsGroupMember]
    
    def get_queryset(self):
        return WithdrawalRequest.objects.filter(
            goal_id=self.kwargs['goal_id']
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsGroupMember])
def vote_withdrawal_request(request, goal_id, request_id):
    """Vote approve/reject on a withdrawal request."""
    
    withdrawal_req = get_object_or_404(
        WithdrawalRequest, 
        id=request_id, 
        goal_id=goal_id
    )
    
    # Check if user is a participant
    participant = get_object_or_404(
        GroupParticipant, 
        goal=withdrawal_req.goal, 
        user=request.user
    )
    
    # Check if already voted
    if WithdrawalVote.objects.filter(
        withdrawal_req=withdrawal_req,
        participant=request.user
    ).exists():
        return Response(
            {'error': 'You have already voted on this request.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    vote_type = request.data.get('vote')
    if vote_type not in ['approve', 'reject']:
        return Response(
            {'error': 'Vote must be either "approve" or "reject".'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create vote
    vote = WithdrawalVote.objects.create(
        withdrawal_req=withdrawal_req,
        participant=request.user,
        vote=vote_type
    )
    
    # Check if consensus reached
    if withdrawal_req.is_approved:
        withdrawal_req.status = 'approved'
        withdrawal_req.resolved_at = timezone.now()
        withdrawal_req.save()
        
        # Process withdrawal (will be implemented in transactions app)
        # process_withdrawal(withdrawal_req)
        
    elif withdrawal_req.is_rejected:
        withdrawal_req.status = 'rejected'
        withdrawal_req.resolved_at = timezone.now()
        withdrawal_req.save()
    
    serializer = WithdrawalRequestSerializer(withdrawal_req)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
