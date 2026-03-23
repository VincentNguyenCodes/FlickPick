import torch
import torch.nn as nn
import numpy as np
from .models import Movie, Rating

GENRES = [
    'Action', 'Thriller', 'Crime', 'Drama', 'Romance',
    'Sci-Fi', 'Comedy', 'Horror', 'Adventure', 'Fantasy', 'War', 'Animation'
]
GENRE_INDEX = {g: i for i, g in enumerate(GENRES)}
NUM_GENRES = len(GENRES)

AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+']
GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
REGIONS = ['Americas', 'Europe', 'East Asia', 'South/SE Asia', 'Middle East/Africa', 'Oceania']

MOVIE_FEATURE_DIM = 14
USER_FEATURE_DIM = NUM_GENRES * 2 + 2 + len(AGE_RANGES) + len(GENDERS) + len(REGIONS)
EMBEDDING_DIM = 32

RATING_LIKE_THRESHOLD = 4
RATING_DISLIKE_THRESHOLD = 2


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
        if r.rating >= RATING_LIKE_THRESHOLD:
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
            nn.Linear(USER_FEATURE_DIM, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, EMBEDDING_DIM),
        )

    def forward(self, x):
        return self.net(x)


class MovieNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(MOVIE_FEATURE_DIM, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, EMBEDDING_DIM),
        )

    def forward(self, x):
        return self.net(x)


class TwoTowerNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.user_net = UserNet()
        self.movie_net = MovieNet()

    def forward(self, x_u, x_m):
        v_u = self.user_net(x_u)
        v_m = self.movie_net(x_m)
        dot = (v_u * v_m).sum(dim=1, keepdim=True)
        return torch.sigmoid(dot)


def train_global_model(epochs=100, lr=0.001, l2=1e-4):
    from django.contrib.auth.models import User

    all_ratings = list(Rating.objects.select_related('movie', 'user__profile').all())
    labeled = [(r, 1.0) for r in all_ratings if r.rating >= RATING_LIKE_THRESHOLD]
    labeled += [(r, 0.0) for r in all_ratings if r.rating <= RATING_DISLIKE_THRESHOLD]

    if len(labeled) < 4:
        return None

    X_u, X_m, y = [], [], []
    for r, label in labeled:
        X_u.append(build_user_features(r.user))
        X_m.append(movie_to_vector(r.movie))
        y.append(label)

    X_u_t = torch.tensor(X_u, dtype=torch.float32)
    X_m_t = torch.tensor(X_m, dtype=torch.float32)
    y_t = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    model = TwoTowerNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=l2)
    criterion = nn.MSELoss()

    model.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        pred = model(X_u_t, X_m_t)
        loss = criterion(pred, y_t)
        loss.backward()
        optimizer.step()

    return model


def train_user_net(user, movie_net_state, epochs=60, lr=0.001, l2=1e-4):
    ratings = list(Rating.objects.filter(user=user).select_related('movie'))
    labeled = [(r, 1.0) for r in ratings if r.rating >= RATING_LIKE_THRESHOLD]
    labeled += [(r, 0.0) for r in ratings if r.rating <= RATING_DISLIKE_THRESHOLD]

    if len(labeled) < 2:
        return None

    movie_net = MovieNet()
    movie_net.load_state_dict(movie_net_state)
    movie_net.eval()
    for param in movie_net.parameters():
        param.requires_grad = False

    user_net = UserNet()

    X_u, X_m_emb, y = [], [], []
    with torch.no_grad():
        for r, label in labeled:
            x_m = torch.tensor([movie_to_vector(r.movie)], dtype=torch.float32)
            emb = movie_net(x_m).squeeze(0).tolist()
            X_u.append(build_user_features(user))
            X_m_emb.append(emb)
            y.append(label)

    X_u_t = torch.tensor(X_u, dtype=torch.float32)
    X_m_t = torch.tensor(X_m_emb, dtype=torch.float32)
    y_t = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    optimizer = torch.optim.Adam(user_net.parameters(), lr=lr, weight_decay=l2)
    criterion = nn.MSELoss()

    user_net.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        v_u = user_net(X_u_t)
        dot = (v_u * X_m_t).sum(dim=1, keepdim=True)
        pred = torch.sigmoid(dot)
        loss = criterion(pred, y_t)
        loss.backward()
        optimizer.step()

    return user_net


def compute_all_movie_embeddings(movie_net_state, batch_size=256):
    movie_net = MovieNet()
    movie_net.load_state_dict(movie_net_state)
    movie_net.eval()

    movies = list(Movie.objects.all())
    with torch.no_grad():
        for i in range(0, len(movies), batch_size):
            batch = movies[i:i + batch_size]
            X = torch.tensor([movie_to_vector(m) for m in batch], dtype=torch.float32)
            embeddings = movie_net(X).tolist()
            for movie, emb in zip(batch, embeddings):
                movie.embedding = emb
            Movie.objects.bulk_update(batch, ['embedding'])


def _cold_start_scores(user, candidates):
    ratings = list(Rating.objects.filter(user=user).select_related('movie'))
    liked = [r.movie for r in ratings if r.rating >= RATING_LIKE_THRESHOLD]

    if not liked:
        try:
            preferred = user.profile.preferred_genres or []
        except Exception:
            preferred = []
        v_u = [0.0] * 12
        for g in preferred:
            aff = GENRE_AFFINITY.get(g, [0.0] * 12)
            for i in range(12):
                v_u[i] += aff[i]
        norm = sum(v_u) or 1.0
        v_u = [x / norm for x in v_u]
    else:
        v_u = [0.0] * 12
        for m in liked:
            aff = GENRE_AFFINITY.get(m.genre, [0.0] * 12)
            for i in range(12):
                v_u[i] += aff[i]
        norm = sum(v_u) or 1.0
        v_u = [x / norm for x in v_u]

    scored = []
    for movie in candidates:
        if movie.embedding:
            emb = movie.embedding[:12]
        else:
            emb = GENRE_AFFINITY.get(movie.genre, [0.0] * 12)
        score = sum(v_u[i] * emb[i] for i in range(12))
        scored.append((score, movie))
    return scored


def get_recommendations(user, top_k=10, genre=None):
    import pickle
    import base64
    from django.core.cache import cache

    rated_ids = set(Rating.objects.filter(user=user).values_list('movie_id', flat=True))
    candidates = list(Movie.objects.exclude(id__in=rated_ids))
    if genre:
        candidates = [m for m in candidates if m.genre == genre]

    rating_count = Rating.objects.filter(user=user).count()

    if rating_count < 3:
        scored = _cold_start_scores(user, candidates)
    else:
        user_net = None
        cached = cache.get(f'flickpick_user_net_{user.id}')
        if cached:
            try:
                user_net = UserNet()
                user_net.load_state_dict(pickle.loads(base64.b64decode(cached)))
                user_net.eval()
            except Exception:
                user_net = None

        if user_net is None:
            scored = _cold_start_scores(user, candidates)
        else:
            scored = []
            with torch.no_grad():
                x_u = torch.tensor([build_user_features(user)], dtype=torch.float32)
                v_u = user_net(x_u).squeeze(0)
                for movie in candidates:
                    if movie.embedding:
                        v_m = torch.tensor(movie.embedding, dtype=torch.float32)
                        score = (v_u * v_m).sum().item()
                    else:
                        score = movie.avg_rating / 10.0
                    scored.append((score, movie))

    scored.sort(key=lambda t: t[0], reverse=True)
    top = scored[:top_k]

    raw_scores = [s for s, _ in top]
    if not raw_scores:
        return []
    lo, hi = min(raw_scores), max(raw_scores)
    score_range = hi - lo

    def normalize(s):
        if score_range < 0.01:
            return round(s * 100)
        return round(60 + (s - lo) / score_range * 37)

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
            'match': normalize(score),
        })

    return results
