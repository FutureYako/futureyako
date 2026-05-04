from django.urls import path
from . import views

app_name = "payments"

urlpatterns = [
    path("deposit/mno/", views.initiate_mno_deposit, name="mno-deposit"),
    path("deposit/bank/", views.initiate_bank_deposit, name="bank-deposit"),
    path("webhook/", views.ultraner_webhook, name="ultraner-webhook"),
]
