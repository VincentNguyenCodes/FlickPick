import torch
import torch.nn as nn
import numpy as np
from .models import Movie, Rating

GENRES = ['Action', 'Romance', 'Sci-Fi', 'Comedy', 'Horror']
GENRE_INDEX = {g: i for i, g in enumerate(GENRES)}

# ── Feature extraction ────────────────────────────────────────────────────────

def movie_to_vector(movie):
    """
    Encode a single Movie into a fixed-length feature vector.

    [genre_one_hot (5), avg_rating_normalized (1)] → length 6
    """
    genre_vec = [0.0] * len(GENRES)
    idx = GENRE_INDEX.get(movie.genre)
    if idx is not None:
        genre_vec[idx] = 1.0

    rating_norm = movie.avg_rating / 10.0
    return genre_vec + [rating_norm]   # length 6


def user_preference_vector(user):
    """
    Build a preference vector from the user's rating history.

    [avg_rating_per_genre (5), overall_avg_rating (1)] → length 6
    """
    ratings = Rating.objects.filter(user=user).select_related('movie')

    genre_totals = {g: [] for g in GENRES}
    all_ratings = []

    for r in ratings:
        g = r.movie.genre
        if g in genre_totals:
            genre_totals[g].append(r.rating)
        all_ratings.append(r.rating)

    genre_avgs = []
    for g in GENRES:
        vals = genre_totals[g]
        genre_avgs.append((sum(vals) / len(vals) / 5.0) if vals else 0.5)

    overall_avg = (sum(all_ratings) / len(all_ratings) / 5.0) if all_ratings else 0.5
    return genre_avgs + [overall_avg]   # length 6


def build_input(movie, user_pref_vec):
    """Concatenate movie vector + user preference vector → length 12."""
    return movie_to_vector(movie) + user_pref_vec   # length 12


# ── Model ──────────────────────────────────────────────────────────────────────

class RecommenderNet(nn.Module):
    def __init__(self, input_size=12):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.net(x)


# ── Training ───────────────────────────────────────────────────────────────────

def train_model(user):
    """
    Train a per-user model from their rating history.
    Returns the trained model, or None if not enough data.
    """
    ratings = list(Rating.objects.filter(user=user).select_related('movie'))

    # Need at least 3 ratings to train
    if len(ratings) < 3:
        return None

    user_pref = user_preference_vector(user)

    X, y = [], []
    for r in ratings:
        # 4-5 stars = liked (1), 1-2 stars = disliked (0), 3 = skip
        if r.rating >= 4:
            X.append(build_input(r.movie, user_pref))
            y.append(1.0)
        elif r.rating <= 2:
            X.append(build_input(r.movie, user_pref))
            y.append(0.0)
        # neutral (3 stars) — skip both X and y

    if len(y) < 2:
        return None

    X_tensor = torch.tensor(X, dtype=torch.float32)
    y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    model = RecommenderNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.BCELoss()

    model.train()
    for _ in range(300):
        optimizer.zero_grad()
        pred = model(X_tensor)
        loss = criterion(pred, y_tensor)
        loss.backward()
        optimizer.step()

    return model


# ── Recommendation ─────────────────────────────────────────────────────────────

def get_recommendations(user, top_k=10):
    """
    Score all movies the user hasn't rated, return top_k as dicts.
    Falls back to rating-sorted list if model can't be trained.
    """
    rated_ids = set(
        Rating.objects.filter(user=user).values_list('movie_id', flat=True)
    )
    candidates = Movie.objects.exclude(id__in=rated_ids)

    model = train_model(user)
    user_pref = user_preference_vector(user)

    scored = []
    if model is not None:
        model.eval()
        with torch.no_grad():
            for movie in candidates:
                x = torch.tensor([build_input(movie, user_pref)], dtype=torch.float32)
                score = model(x).item()
                scored.append((score, movie))
    else:
        # Fallback: rank by TMDB avg_rating
        for movie in candidates:
            scored.append((movie.avg_rating / 10.0, movie))

    scored.sort(key=lambda t: t[0], reverse=True)
    top = scored[:top_k]

    results = []
    for rank, (score, movie) in enumerate(top, 1):
        results.append({
            'id': movie.id,
            'title': movie.title,
            'year': movie.year,
            'genre': movie.genre,
            'director': movie.director,
            'cast': movie.cast,
            'rating': movie.avg_rating,
            'poster': movie.poster_url,
            'description': movie.description,
            'match': round(score * 100),
        })

    return results
