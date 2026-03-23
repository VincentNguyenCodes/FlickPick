from django.contrib import admin
from .models import Movie, Rating, UserProfile


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'year', 'genre', 'avg_rating')
    list_filter = ('genre',)
    search_fields = ('title', 'director')
