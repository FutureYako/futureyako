from django.urls import path
from . import views

app_name = 'investments'

urlpatterns = [
    # Investment funds  (/api/investments/funds/)
    path('funds/', views.InvestmentFundListView.as_view(), name='fund-list'),
    path('funds/<uuid:pk>/', views.InvestmentFundDetailView.as_view(), name='fund-detail'),

    # Preview  (/api/investments/review/)
    path('review/', views.review_investment, name='review-investment'),

    # User holdings  (/api/investments/  and  /api/investments/{id}/)
    path('', views.InvestmentListCreateView.as_view(), name='investment-list'),
    path('<uuid:pk>/', views.InvestmentDetailView.as_view(), name='investment-detail'),

    # Portfolio  (/api/investments/portfolio/...)
    path('portfolio/', views.portfolio_summary, name='portfolio-summary'),
    path('portfolio/allocation/', views.portfolio_allocation, name='portfolio-allocation'),
    path('portfolio/returns/', views.portfolio_returns, name='portfolio-returns'),
    path('portfolio/snapshot/', views.create_portfolio_snapshot, name='create-snapshot'),
]
