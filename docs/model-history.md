# FlickPick Model History

---

## V2 - Two-Tower Neural Network (current)

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
