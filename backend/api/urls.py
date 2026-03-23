from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.register),
    path('auth/login/', views.login),
    path('onboarding/', views.onboarding),
    path('ratings/', views.submit_rating),
    path('recommendations/', views.get_recommendations),
    path('watched/', views.get_watched),
    path('auth/delete-account/', views.delete_account),
    path('recommendations/animated/', views.get_animated),
    path('profile/', views.get_profile),
    path('genres/', views.get_genres),
]
