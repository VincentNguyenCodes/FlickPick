from django.contrib import admin
from .models import Movie, Rating, UserProfile


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'year', 'genre', 'avg_rating')
    list_filter = ('genre',)
    search_fields = ('title', 'director')


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'rating', 'created_at')
    list_filter = ('rating',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'onboarded', 'age_range', 'gender', 'region')
