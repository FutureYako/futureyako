from django.urls import path
from . import views

app_name = 'goals'

urlpatterns = [
    # Goal CRUD
    path('', views.GoalListCreateView.as_view(), name='goal-list'),
    path('<uuid:pk>/', views.GoalDetailView.as_view(), name='goal-detail'),
    
    # Group goal participants
    path('<uuid:goal_id>/participants/', views.GroupParticipantListView.as_view(), name='goal-participants'),
    path('join/', views.join_group_goal, name='join-group-goal'),
    path('<uuid:goal_id>/invite/', views.invite_to_group_goal, name='invite-to-group'),
    path('<uuid:goal_id>/participants/<uuid:user_id>/', views.remove_group_participant, name='remove-participant'),
    path('<uuid:goal_id>/contribute/', views.contribute_to_group_goal, name='contribute-to-group'),
    
    # Withdrawal requests
    path('<uuid:goal_id>/withdrawal-requests/', views.WithdrawalRequestListCreateView.as_view(), name='withdrawal-request-list'),
    path('<uuid:goal_id>/withdrawal-requests/<uuid:request_id>/', views.WithdrawalRequestDetailView.as_view(), name='withdrawal-request-detail'),
    path('<uuid:goal_id>/withdrawal-requests/<uuid:request_id>/vote/', views.vote_withdrawal_request, name='vote-withdrawal-request'),
]
