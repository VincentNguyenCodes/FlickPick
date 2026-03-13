# FlickPick

A full-stack personalized movie recommendation app that trains a per-user PyTorch neural network on your rating history to surface the 10 movies you're most likely to enjoy next.

---

## Features

- **Personalized recommendations** — a dedicated neural network is trained for each user based on their own ratings
- **Onboarding flow** — new users rate up to 10 movies across 5 genres (Action, Romance, Sci-Fi, Comedy, Horror) to cold-start the model
- **Live updates** — marking a movie as watched retrains your model immediately and refills the list to 10
- **Watched history** — full watch history with your star ratings and dates
- **Account management** — avatar dropdown with settings modal; account deletion wipes all personal data from the database
- **200-movie catalog** — seeded from TMDB's top-rated English films with posters, cast, director, and genre

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
└──────────────────────────┬──────────────────────────────┘
                           │
               ┌───────────▼───────────┐
               │   RecommenderNet      │
               │   12 inputs → 1 out   │
               │   (like probability)  │
               └───────────┬───────────┘
                           │
               ┌───────────▼───────────┐
               │  SQLite (dev)         │
               │  Movie, Rating,       │
               │  UserProfile          │
               └───────────────────────┘
```

---

## Neural Network Model

**Architecture:** 3-layer MLP with dropout (12 → 64 → 32 → 1)

**Input features (12 total):**
| Feature Group | Size | Description |
|---|---|---|
| Genre one-hot | 5 | Action, Romance, Sci-Fi, Comedy, Horror |
| Normalized TMDB rating | 1 | avg_rating / 10 |
| User genre preference | 5 | Average user rating per genre (normalized) |
| User overall average | 1 | User's mean rating across all movies |

**Output:** Probability (0–1) that the user will like the movie

**Training:** Adam optimizer (lr=0.01), BCELoss, 300 epochs, Dropout(0.3)
Ratings 4–5 → liked (1), ratings 1–2 → disliked (0), rating 3 → skipped from training

**Fallback:** If fewer than 3 ratings or fewer than 2 labeled examples exist, recommendations fall back to global TMDB average rating ranking.

---

## Project Structure

```
.
├── backend/
│   ├── api/
│   │   ├── models.py               # Movie, Rating, UserProfile
│   │   ├── views.py                # All API endpoints
│   │   ├── urls.py
│   │   ├── ml_model.py             # RecommenderNet, feature engineering, training
│   │   └── management/
│   │       └── commands/
│   │           └── seed_movies.py  # Seeds initial 30 curated movies
│   ├── backend/
│   │   └── settings.py
│   ├── fetch_movies.py             # Fetches top 200 movies from TMDB API
│   ├── .env.example
│   └── manage.py
├── frontend/
│   └── src/
│       ├── App.js
│       ├── pages/
│       │   ├── WelcomePage.jsx     # Login / register
│       │   ├── OnboardingPage.jsx  # Initial 10-movie rating flow
│       │   └── RecommendationsPage.jsx
│       └── components/
│           ├── Logo.jsx
│           ├── AvatarMenu.jsx      # Header dropdown (Settings, Log Out)
│           ├── SettingsModal.jsx   # Account deletion
│           ├── RatingModal.jsx     # Star rating after watching
│           └── StarRating.jsx
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
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers torch python-dotenv
```

### 3. Set up the database and seed movies

```bash
cd backend
python manage.py migrate
python manage.py seed_movies       # seeds 30 curated onboarding movies
python fetch_movies.py             # fetches top 200 from TMDB (optional but recommended)
```

### 4. Start the Django backend

```bash
python manage.py runserver
```

API available at `http://127.0.0.1:8000/api/`

### 5. Start the React frontend

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
| `POST` | `/api/onboarding/` | Submit onboarding ratings |
| `POST` | `/api/ratings/` | Rate a watched movie (1–5 stars) |
| `GET` | `/api/recommendations/` | Get top 10 personalized picks |
| `GET` | `/api/watched/` | Get full watch history |

### Example — get recommendations

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

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, CSS |
| Backend | Python 3.9, Django 4.2, Django REST Framework |
| Auth | djangorestframework-simplejwt (JWT) |
| ML | PyTorch 2.x |
| Movie data | TMDB API |
| Database | SQLite (dev) |
