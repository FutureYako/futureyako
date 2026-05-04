from django.urls import path
from . import views

app_name = 'autosave'

urlpatterns = [
    # Saving preferences
    path('preferences/', views.SavingPreferenceDetailView.as_view(), name='saving-preferences'),
    path('preferences/toggle/', views.toggle_autosave, name='toggle-autosave'),
    
    # Deduction logs
    path('preferences/logs/', views.DeductionLogListView.as_view(), name='deduction-logs'),
    
    # Goal weights
    path('goal-weights/', views.GoalWeightListCreateView.as_view(), name='goal-weights'),
    path('goal-weights/<uuid:pk>/', views.GoalWeightDetailView.as_view(), name='goal-weight-detail'),
    
    # Onboarding
    path('onboarding/', views.onboarding_status, name='onboarding-status'),
    path('onboarding/step/', views.update_onboarding_step, name='update-onboarding-step'),
    
    # Summary
    path('summary/', views.autosave_summary, name='autosave-summary'),
]
