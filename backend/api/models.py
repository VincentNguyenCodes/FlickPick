from django.db import models
from django.contrib.auth.models import User


class Movie(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    title = models.CharField(max_length=255)
    year = models.IntegerField()
    genre = models.CharField(max_length=100)
    director = models.CharField(max_length=255)
    cast = models.JSONField(default=list)
    avg_rating = models.FloatField()
    poster_url = models.URLField(max_length=500)
    description = models.TextField(blank=True)
    embedding = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.year})"


class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'movie')

    def __str__(self):
        return f"{self.user.username} → {self.movie.title}: {self.rating}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    onboarded = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
