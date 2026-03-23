import torch
import torch.nn as nn
import numpy as np
from .models import Movie, Rating

GENRES = [
    'Action', 'Thriller', 'Crime', 'Drama', 'Romance',
    'Sci-Fi', 'Comedy', 'Horror', 'Adventure', 'Fantasy', 'War', 'Animation'
]
GENRE_INDEX = {g: i for i, g in enumerate(GENRES)}

AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+']
GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
REGIONS = ['Americas', 'Europe', 'East Asia', 'South/SE Asia', 'Middle East/Africa', 'Oceania']


def decade_norm(year):
    decade = (year // 10) * 10
    return max(0.0, min(1.0, (decade - 1920) / 100.0))


GENRE_AFFINITY = {
    'Action':    [1.0, 0.5, 0.3, 0.0, 0.0, 0.3, 0.0, 0.0, 0.7, 0.0, 0.4, 0.0],
    'Thriller':  [0.5, 1.0, 0.7, 0.3, 0.0, 0.2, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0],
    'Crime':     [0.3, 0.7, 1.0, 0.5, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    'Drama':     [0.0, 0.3, 0.4, 1.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.3, 0.5, 0.0],
    'Romance':   [0.0, 0.0, 0.0, 0.4, 1.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0],
    'Sci-Fi':    [0.3, 0.2, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0],
    'Comedy':    [0.0, 0.0, 0.0, 0.2, 0.3, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.3],
    'Horror':    [0.0, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
    'Adventure': [0.7, 0.0, 0.0, 0.0, 0.0, 0.4, 0.0, 0.0, 1.0, 0.6, 0.3, 0.2],
    'Fantasy':   [0.0, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0, 0.0, 0.3],
    'War':       [0.4, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.3, 0.0, 1.0, 0.0],
    'Animation': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.0, 0.2, 0.3, 0.0, 1.0],
}


def movie_to_vector(movie):
    affinity = GENRE_AFFINITY.get(movie.genre, [0.0] * 12)
    rating_norm = movie.avg_rating / 10.0
    year_norm = decade_norm(movie.year)
    return affinity + [rating_norm, year_norm]


def build_user_features(user):
    from .models import UserProfile
    ratings = list(Rating.objects.filter(user=user).select_related('movie'))

    genre_totals = {g: [] for g in GENRES}
    all_ratings = []
    liked_decades = []

    for r in ratings:
        g = r.movie.genre
        if g in genre_totals:
            genre_totals[g].append(r.rating)
        all_ratings.append(r.rating)
        if r.rating >= 4:
            liked_decades.append(decade_norm(r.movie.year))

    genre_avgs = []
    for g in GENRES:
        vals = genre_totals[g]
        genre_avgs.append((sum(vals) / len(vals) / 5.0) if vals else 0.0)

    overall_avg = (sum(all_ratings) / len(all_ratings) / 5.0) if all_ratings else 0.5
    avg_liked_decade = (sum(liked_decades) / len(liked_decades)) if liked_decades else 0.5

    try:
        profile = user.profile
    except Exception:
        profile = None

    preferred = getattr(profile, 'preferred_genres', []) or []
    genre_picks = [1.0 if g in preferred else 0.0 for g in GENRES]

    age_range = getattr(profile, 'age_range', '') or ''
    age_one_hot = [1.0 if a == age_range else 0.0 for a in AGE_RANGES]

    gender = getattr(profile, 'gender', '') or ''
    gender_one_hot = [1.0 if gd == gender else 0.0 for gd in GENDERS]

    region = getattr(profile, 'region', '') or ''
    region_one_hot = [1.0 if r == region else 0.0 for r in REGIONS]

    return (
        genre_avgs
        + genre_picks
        + [overall_avg, avg_liked_decade]
        + age_one_hot
        + gender_one_hot
        + region_one_hot
    )


class UserNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(42, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
        )

    def forward(self, x):
        return self.net(x)
