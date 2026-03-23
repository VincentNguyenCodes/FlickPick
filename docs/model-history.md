# FlickPick Model History

---

## V2.1 - Cold-Start Overhaul + is_animated Architecture (current)

### What changed from V2

- **Replaced Animation genre with `is_animated` boolean flag.** Animated movies are no longer bucketed into a generic "Animation" genre. They now carry their real content genre (Adventure, Fantasy, Comedy, Drama, etc.), which is used as-is by the ML model. Separation from live-action is enforced by `Movie.is_animated = True` rather than by genre string.

- **Animated section scored independently.** The recommendations endpoint detects when the requested genre is animated and runs a fully separate pipeline: candidates are filtered by `is_animated=True`, sorted by `avg_rating` descending, and padded with highest-rated animated films if fewer than `top_k` are available. No two-tower or cold-start scoring is applied to the animated section.

- **Animated ratings excluded from live-action cold-start.** When building V_u for the live-action cold-start, ratings on animated movies are skipped so they do not inflate the wrong genre dimensions in the user vector.

- **Cosine similarity replaces raw dot product in cold-start.** The GENRE_AFFINITY row sum differs per genre (Adventure = 3.2, Romance = 1.7). A raw dot product of V_u against each movie's affinity row systematically favored high-sum genres. Each movie's affinity vector is now L2-normalized before scoring, making the comparison direction-based (cosine similarity) and eliminating the row-sum bias.

- **Rating blend added to cold-start scoring.** Movies in the same genre previously received identical scores, making ranking within a genre arbitrary. The final cold-start score is now `genre_score * 0.5 + (avg_rating / 10.0) * 0.5` so higher-rated movies rank above lower-rated ones when genre similarity is equal.

- **Genre diversity cap in top-k selection.** After scoring, movies are selected greedily with a cap of `max(2, top_k // num_genres + 1)` per genre before filling remaining slots from the global ranked list. This prevents any single genre from occupying all 10 recommendation slots.

- **Catalog expanded to 342 movies** - 213 animated (from TMDB animated top-rated, each tagged with real content genre) and 129 live-action across 11 genres.

### Files changed

- `backend/api/models.py` - added `is_animated = BooleanField(default=False)`
- `backend/api/ml_model.py` - `_cold_start_scores` and `get_recommendations` updated as above
- `backend/api/management/commands/seed_movies.py` - all entries given `is_animated` flag; 200 additional animated movies added

---

## V2 - Two-Tower Neural Network

### What changed from V1

- Replaced per-user MLP with a two-tower architecture: UserNet and MovieNet trained jointly on all user-movie pairs.
- Expanded genres from 6 to 12, adding Thriller, Crime, Drama, Adventure, Fantasy, and War.
- Added a 12x12 GENRE_AFFINITY matrix encoding soft cross-genre similarity instead of one-hot genre encoding.
- User feature vector expanded from 8 to 42 dimensions, incorporating demographic signals (age range, gender, region) and onboarding genre picks.
- Movie feature vector is now 14 dimensions using genre affinity rows instead of one-hot genre flags.
- Introduced global training phase (all users, all ratings) followed by per-user UserNet fine-tuning with MovieNet frozen.
- Pre-computed 32-dim movie embeddings stored in PostgreSQL for instant dot-product inference.
- Cold start now uses genre affinity vectors from onboarding picks instead of falling back to TMDB ranking.

### Architecture

```
UserNet: 42 -> 128 -> 64 -> 32 (ReLU, Dropout 0.3)
MovieNet: 14 -> 64 -> 32 (ReLU, Dropout 0.3)
TwoTowerNet: prediction = sigmoid(V_u . V_m)
```

### Input Features

**Movie features X_m (14 dims):**
| Feature | Dims | Description |
|---|---|---|
| Genre affinity vector | 12 | Row from GENRE_AFFINITY for the movie's genre |
| Normalized TMDB rating | 1 | avg_rating / 10.0 |
| Decade norm | 1 | (decade - 1920) / 100.0, clamped 0-1 |

**User features X_u (42 dims):**
| Feature | Dims | Description |
|---|---|---|
| Per-genre rating averages | 12 | Mean user rating per genre / 5.0 |
| Onboarding genre picks | 12 | Multi-hot of selected preferred genres |
| Overall avg rating | 1 | Mean of all user ratings / 5.0 |
| Avg decade of liked movies | 1 | decade_norm of liked movies |
| Age range one-hot | 6 | 13-17, 18-24, 25-34, 35-44, 45-54, 55+ |
| Gender one-hot | 4 | Male, Female, Non-binary, Prefer not to say |
| Region one-hot | 6 | Americas, Europe, East Asia, South/SE Asia, Middle East/Africa, Oceania |

### Training Configuration

| Setting | Value |
|---|---|
| Global training loss | MSE on sigmoid(V_u . V_m) |
| L2 regularization | weight_decay = 1e-4 |
| Global optimizer | Adam, lr = 0.001 |
| Global epochs | 100 |
| Labels | rating >= 4 -> 1.0, rating <= 2 -> 0.0, rating 3 skipped |
| Per-user fine-tune epochs | 60 |
| Per-user optimizer | Adam, lr = 0.001 |
| MovieNet during fine-tune | Frozen |
| Cache | Redis, TTL 24h (UserNet weights per user) |
| Embedding storage | PostgreSQL (Movie.embedding JSON, 32 dims) |

---

## V1 - RecommenderNet (retired)

### Architecture

A per-user 3-layer MLP trained independently for each user on their own rating history.

```
RecommenderNet: 16 -> 64 -> 32 -> 1 (ReLU, Dropout 0.3, Sigmoid output)
```

### Input Features (16 dims total)

| Feature | Dims | Description |
|---|---|---|
| Genre one-hot | 6 | Action, Romance, Sci-Fi, Comedy, Horror, Animation |
| Normalized TMDB rating | 1 | avg_rating / 10 |
| Decade weight | 1 | decade_norm * 0.5 |
| User genre preference | 6 | Mean user rating per genre / 5.0 |
| User overall average | 1 | Mean of all user ratings / 5.0 |
| User avg liked decade | 1 | decade_norm of liked movies * 0.5 |

### Training Configuration

| Setting | V1 | V2 |
|---|---|---|
| Loss | BCELoss | MSELoss |
| Optimizer | Adam, lr=0.01 | Adam, lr=0.001 |
| Epochs | 80 | 100 global + 60 per-user |
| Training scope | Per user | Global then per-user fine-tune |
| Input size | 16 | 14 (movie) + 42 (user) |
| Output | Scalar probability | 32-dim embedding |
| Genres | 6 | 12 |

### Known Weaknesses

- No cross-user signal: each model trained only on its own user's data, ignoring community patterns.
- One-hot genre encoding treats all genres as equally dissimilar; no soft genre relationship encoding.
- Cold start fell back to raw TMDB average with no personalization signal at all.
- Model retrained from scratch on every rating submission; no incremental update path.
- 6-genre taxonomy too coarse; Thriller, Crime, Drama, etc. were missing or incorrectly bucketed.
