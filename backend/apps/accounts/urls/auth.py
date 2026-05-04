from django.urls import path
from .. import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('login/2fa/', views.complete_2fa_login, name='complete-2fa-login'),
    path('token/refresh/', views.refresh_token, name='refresh-token'),
    path('logout/', views.logout, name='logout'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
]
