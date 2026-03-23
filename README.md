# FlickPick

A full-stack personalized movie recommendation app powered by a two-tower neural network. UserNet and MovieNet each produce 32-dim embeddings trained jointly on all user-movie pairs, then per-user UserNet fine-tuning via Celery surfaces the 10 movies you're most likely to enjoy next.

See [docs/model-history.md](docs/model-history.md) for V1 vs V2 comparison.

---

## Features

- **Personalized recommendations** - a two-tower network produces a user embedding and pre-computed movie embeddings; inference is a dot product with no retraining on demand
- **Onboarding flow** - new users select genre preferences, age range, gender, and region on Step 1, then rate up to 10 movies across 12 genres on Step 2 to cold-start the model
- **Live updates** - marking a movie as watched fine-tunes your UserNet immediately via Celery and refills the list to 10
- **Watched history** - full watch history with your star ratings and dates
- **Account management** - avatar dropdown with settings modal; account deletion wipes all personal data from the database
- **342-movie curated catalog** - 129 live-action films across 11 genres and 213 animated films stored with their real content genres (Adventure, Fantasy, Comedy, etc.) and separated from the live-action pipeline via an `is_animated` flag

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│   Welcome  │  Onboarding  │  Recommendations  │  Watched│
└──────────────┬──────────────────────────┬───────────────┘
               │ HTTP / JWT               │ HTTP / JWT
               ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│               Django REST API (port 8000)                │
│  /api/auth/   /api/onboarding/   /api/recommendations/  │
│  /api/ratings/   /api/watched/   /api/auth/delete-account│
└───────┬──────────────────────────────────┬──────────────┘
        │ enqueue fine-tune job            │ load cached UserNet
        ▼                                  ▼
┌───────────────┐                 ┌────────────────┐
│  Celery       │  train & cache  │  Redis         │
│  Worker       │────────────────▶│  UserNet       │
│  (fine-tune)  │                 │  weights/user  │
└───────────────┘                 └────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│           Two-Tower Network             │
│  UserNet     42 -> 128 -> 64 -> 32      │
│  MovieNet    14 -> 64 -> 32             │
│  Score = sigmoid(V_u . V_m)             │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼───────────┐
│  PostgreSQL                        │
│  Movie (+ embedding[32], is_animated)  │
│  Rating, UserProfile               │
└───────────────────────────┘
```

---

## Neural Network Model

**Architecture:** Two-tower network. UserNet and MovieNet each output 32-dim embeddings. Final score = sigmoid(V_u . V_m).

**Movie features X_m (14 dims):**
| Feature | Dims | Description |
|---|---|---|
| Genre affinity vector | 12 | Row from 12x12 GENRE_AFFINITY matrix |
| Normalized TMDB rating | 1 | avg_rating / 10.0 |
| Decade norm | 1 | (decade - 1920) / 100.0 |

**User features X_u (42 dims):**
| Feature | Dims | Description |
|---|---|---|
| Per-genre rating averages | 12 | Mean user rating per genre / 5.0 |
| Onboarding genre picks | 12 | Multi-hot of preferred genres |
| Overall avg rating | 1 | Mean of all user ratings / 5.0 |
| Avg decade of liked movies | 1 | decade_norm of liked movies |
| Age range one-hot | 6 | 13-17, 18-24, 25-34, 35-44, 45-54, 55+ |
| Gender one-hot | 4 | Male, Female, Non-binary, Prefer not to say |
| Region one-hot | 6 | Americas, Europe, East Asia, South/SE Asia, Middle East/Africa, Oceania |

**Training - Phase 1 (global):** Train full TwoTowerNet on all user-movie pairs. Loss = MSE on dot product output. Adam lr=0.001, weight_decay=1e-4, 100 epochs. Ratings >= 4 -> 1.0, <= 2 -> 0.0, 3 skipped. After training, run all movies through MovieNet and store 32-dim embeddings in Movie.embedding.

**Training - Phase 2 (per-user):** Fine-tune only UserNet (MovieNet frozen) on that user's ratings. 60 epochs. Cache UserNet weights in Redis (key: flickpick_user_net_{user_id}, TTL 24h).

**Cold start (< 3 ratings):** Build V_u as weighted average of GENRE_AFFINITY rows for the genres the user has rated (live-action only). Score each candidate movie by cosine similarity between V_u and its GENRE_AFFINITY row, blended 50/50 with normalized avg_rating to differentiate within genres. A per-genre diversity cap (max 2 per genre, or top_k / num_genres + 1) prevents any single genre from dominating. Animated ratings are excluded from the live-action user vector, and animated movies are scored by avg_rating alone in a separate pipeline. No network inference.

---

## Project Structure

```
.
├── backend/
│   ├── api/
│   │   ├── models.py               # Movie (+ embedding), Rating, UserProfile
│   │   ├── views.py                # All API endpoints
│   │   ├── urls.py
│   │   ├── ml_model.py             # TwoTowerNet, feature engineering, training
│   │   ├── tasks.py                # Celery: retrain_user_model, retrain_global_model
│   │   ├── ml/
│   │   │   └── two_tower_weights.pth  # Global model weights (generated)
│   │   └── management/
│   │       └── commands/
│   │           ├── seed_movies.py
│   │           └── compute_movie_embeddings.py
│   ├── backend/
│   │   └── settings.py
│   ├── fetch_movies.py             # Fetches top 1000 movies from TMDB API
│   ├── .env.example
│   └── manage.py
├── frontend/
│   └── src/
│       ├── App.js
│       ├── pages/
│       │   ├── WelcomePage.jsx
│       │   ├── OnboardingPage.jsx  # Step 1: profile, Step 2: movie carousel
│       │   └── RecommendationsPage.jsx
│       └── components/
│           ├── Logo.jsx
│           ├── AvatarMenu.jsx
│           ├── SettingsModal.jsx
│           ├── RatingModal.jsx
│           └── StarRating.jsx
├── docs/
│   └── model-history.md
├── .gitignore
└── README.md
```

---

## Setup & Running

### Prerequisites

- Python 3.9+
- Node.js 18+
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### 1. Configure environment

```bash
cd backend
cp .env.example .env
# Fill in DJANGO_SECRET_KEY and TMDB_API_KEY in .env
```

### 2. Install Python dependencies

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers torch python-dotenv psycopg2-binary celery redis django-redis
```

### 3. Set up the database and seed movies

```bash
cd backend
python manage.py migrate
python manage.py seed_movies       # seeds curated onboarding movies
python fetch_movies.py             # fetches top 1000 from TMDB (recommended)
```

### 4. Train the global model and compute embeddings

```bash
cd backend
python manage.py shell -c "from api.ml_model import train_global_model; import torch, os; m = train_global_model(); torch.save(m.state_dict(), 'api/ml/two_tower_weights.pth') if m else None"
python manage.py compute_movie_embeddings
```

### 5. Start Redis

```bash
redis-server
```

### 6. Start the Celery worker

```bash
cd backend
celery -A backend worker --loglevel=info
```

### 7. Start the Django backend

```bash
python manage.py runserver
```

API available at `http://127.0.0.1:8000/api/`

### 8. Start the React frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | Login, returns JWT |
| `DELETE` | `/api/auth/delete-account/` | Delete account and all data |

### Movies

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/onboarding/` | Submit onboarding ratings + profile fields |
| `POST` | `/api/ratings/` | Rate a watched movie (1-5 stars) |
| `GET` | `/api/recommendations/` | Get top 10 personalized picks |
| `GET` | `/api/watched/` | Get full watch history |

### Example - get recommendations

```
GET /api/recommendations/
Authorization: Bearer <token>
```

```json
{
  "movies": [
    {
      "id": 12,
      "title": "Inception",
      "year": 2010,
      "genre": "Sci-Fi",
      "director": "Christopher Nolan",
      "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
      "rating": 8.8,
      "match": 94,
      "poster": "https://image.tmdb.org/t/p/w500/..."
    }
  ]
}
```

---

## System Design at Scale

The current implementation is designed for a single server with a small user base. Here's how the architecture would evolve to handle 100k+ users:

### Bottleneck 1 - Global model retraining frequency
**Problem:** The global TwoTowerNet must be retrained offline as new rating data accumulates. Per-user fine-tuning is fast but depends on current MovieNet weights.

**Implemented:** Rating submissions enqueue a Celery background task that fine-tunes only UserNet (MovieNet frozen) and stores the serialized weights in Redis (24-hour TTL). Global retraining is a separate `retrain_global_model` Celery task that can be scheduled nightly or triggered manually.

### Bottleneck 2 - Embedding lookup at inference
**Problem:** Dot product against all Movie.embedding rows in PostgreSQL could be slow at 100k+ movies.

**Solution:**
- Move embeddings to an approximate nearest-neighbor index (FAISS or pgvector) for sub-millisecond retrieval.
- Pre-filter candidates by genre before the dot product pass to reduce the search space.

### Bottleneck 3 - Single server
**Problem:** One Django process handles all requests with no horizontal scaling.

**Solution:**
- Containerize with Docker, deploy behind NGINX with multiple Gunicorn workers.
- Separate the ML fine-tune service from the web API.
- Serve static assets through a CDN.

### Revised architecture at scale

```
                         ┌─────────────┐
                         │   CDN       │  <- static assets, posters
                         └─────────────┘
                                │
┌──────────┐    HTTPS    ┌──────▼───────┐
│  Client  │────────────▶│  NGINX LB    │
└──────────┘             └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        ┌──────────┐     ┌──────────┐     ┌──────────┐
        │ Django   │     │ Django   │     │ Django   │  <- Gunicorn workers
        └────┬─────┘     └────┬─────┘     └────┬─────┘
             └────────────────┼────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ PostgreSQL │  │   Redis    │  │  Celery    │
       │  (primary) │  │  (cache +  │  │  workers   │
       │ + replica  │  │   queue)   │  │ (fine-tune │
       └────────────┘  └────────────┘  │  + global) │
                                       └────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, CSS |
| Backend | Python 3.9, Django 4.2, Django REST Framework |
| Auth | djangorestframework-simplejwt (JWT) |
| ML | PyTorch 2.x (Two-Tower: global training + per-user fine-tuning) |
| Async tasks | Celery + Redis |
| Model cache | Redis (UserNet weights per user, TTL 24h) |
| Movie data | TMDB API |
| Database | PostgreSQL (Movie.embedding stored as JSON) |
