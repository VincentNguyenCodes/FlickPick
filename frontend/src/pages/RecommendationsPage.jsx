import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import RatingModal from '../components/RatingModal';
import AvatarMenu from '../components/AvatarMenu';
import SettingsModal from '../components/SettingsModal';
import './RecommendationsPage.css';

function RecommendationsPage() {
  const [tab, setTab] = useState('recommendations');
  const [movies, setMovies] = useState([]);
  const [animated, setAnimated] = useState([]);
  const [watched, setWatched] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingWatched, setLoadingWatched] = useState(false);
  const [modalMovie, setModalMovie] = useState(null);
  const [rerateMovie, setRerateMovie] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const token = localStorage.getItem('token');

  const fetchRecommendations = useCallback(() => {
    setLoadingRecs(true);
    fetch('http://localhost:8000/api/recommendations/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.movies) setMovies(data.movies); })
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, [token]);

  const fetchAnimated = useCallback(() => {
    fetch('http://localhost:8000/api/recommendations/animated/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.movies) setAnimated(data.movies); })
      .catch(() => {});
  }, [token]);

  const fetchWatched = useCallback(() => {
    setLoadingWatched(true);
    fetch('http://localhost:8000/api/watched/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.watched) setWatched(data.watched); })
      .catch(() => {})
      .finally(() => setLoadingWatched(false));
  }, [token]);

  useEffect(() => {
    fetchRecommendations();
    fetchAnimated();
  }, [fetchRecommendations, fetchAnimated]);

  useEffect(() => {
    if (tab === 'watched') fetchWatched();
  }, [tab, fetchWatched]);

  const handleWatched = (movie) => setModalMovie(movie);

  const handleRatingSubmit = async (movie, rating) => {
    setModalMovie(null);
    try {
      await fetch('http://localhost:8000/api/ratings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movie_id: movie.id, rating }),
      });
    } catch {
      // silent fail during dev
    }
    // Retrain + refetch keeps list at 10 with the next best movie
    fetchRecommendations();
    fetchAnimated();
    if (tab === 'watched') fetchWatched();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="recs-page">
      <header className="recs-header">
        <Logo size="sm" />
        <div className="recs-nav">
          <span className="welcome-user">Welcome, <strong>{username}</strong></span>
          <AvatarMenu
            username={username}
            onLogout={handleLogout}
            onSettings={() => setShowSettings(true)}
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-pill ${tab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setTab('recommendations')}
        >
          Your Recommendations
        </button>
        <button
          className={`tab-pill ${tab === 'watched' ? 'active' : ''}`}
          onClick={() => setTab('watched')}
        >
          Watched Movies
          {watched.length > 0 && <span className="tab-count">{watched.length}</span>}
        </button>
      </div>

      <main className="recs-main">

        {/* ── Recommendations Tab ── */}
        {tab === 'recommendations' && (
          <>
            <div className="recs-heading">
              <h1>Your Top Picks</h1>
              <p className="recs-sub">Personalized recommendations based on your taste. Updates as you watch more.</p>
            </div>

            {loadingRecs ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Training your model...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="empty-state">
                <p>No recommendations yet — rate more movies to get started.</p>
              </div>
            ) : (
              <div className="movies-grid">
                {movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className={`movie-card ${hoveredId === movie.id ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredId(movie.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="card-rank">#{index + 1}</div>
                    <img src={movie.poster} alt={movie.title} className="card-poster" />
                    <div className="card-info">
                      <div className="card-match">{movie.match}% Match</div>
                      <h3 className="card-title">{movie.title}</h3>
                      <p className="card-meta">{movie.year} · {movie.genre}</p>
                      <p className="card-director">Dir. {movie.director}</p>
                      <p className="card-cast">{movie.cast.slice(0, 2).join(', ')}</p>
                      <div className="card-rating">★ {movie.rating}</div>
                    </div>
                    <div className="card-hover-overlay">
                      <button className="watched-btn" onClick={() => handleWatched(movie)}>
                        Already Watched
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Animated Section ── */}
            {animated.length > 0 && (
              <div className="animated-section">
                <div className="animated-heading">
                  <h2>Top Animated Movies</h2>
                  <p className="recs-sub">Highest rated animated films you haven't seen yet.</p>
                </div>
                <div className="movies-grid">
                  {animated.map((movie, index) => (
                    <div
                      key={movie.id}
                      className={`movie-card ${hoveredId === movie.id ? 'hovered' : ''}`}
                      onMouseEnter={() => setHoveredId(movie.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="card-rank">#{index + 1}</div>
                      <img src={movie.poster} alt={movie.title} className="card-poster" />
                      <div className="card-info">
                        <div className="card-match">{movie.match}% Match</div>
                        <h3 className="card-title">{movie.title}</h3>
                        <p className="card-meta">{movie.year} · {movie.genre}</p>
                        <p className="card-director">Dir. {movie.director}</p>
                        <p className="card-cast">{movie.cast.slice(0, 2).join(', ')}</p>
                        <div className="card-rating">★ {movie.rating}</div>
                      </div>
                      <div className="card-hover-overlay">
                        <button className="watched-btn" onClick={() => handleWatched(movie)}>
                          Already Watched
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Watched Tab ── */}
        {tab === 'watched' && (
          <>
            <div className="recs-heading">
              <h1>Watched Movies</h1>
              <p className="recs-sub">Your complete watch history and ratings.</p>
            </div>

            {loadingWatched ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading your history...</p>
              </div>
            ) : watched.length === 0 ? (
              <div className="empty-state">
                <p>You haven't rated any movies yet. Go rate some to get recommendations!</p>
              </div>
            ) : (
              <div className="watched-list">
                {watched.map((movie) => (
                  <div key={movie.id} className="watched-row">
                    <img src={movie.poster} alt={movie.title} className="watched-poster" />
                    <div className="watched-info">
                      <h3 className="watched-title">{movie.title} <span className="watched-year">({movie.year})</span></h3>
                      <p className="watched-meta">{movie.genre} · Dir. {movie.director}</p>
                      <p className="watched-cast">{movie.cast.slice(0, 2).join(', ')}</p>
                    </div>
                    <div className="watched-right">
                      <div className="watched-stars">
                        {[1,2,3,4,5].map((s) => (
                          <span key={s} className={s <= movie.user_rating ? 'star-filled' : 'star-empty'}>★</span>
                        ))}
                      </div>
                      <p className="watched-date">{movie.watched_at}</p>
                      <button className="rerate-btn" onClick={() => setRerateMovie(movie)}>Re-rate</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {modalMovie && (
        <RatingModal
          movie={modalMovie}
          onSubmit={handleRatingSubmit}
          onClose={() => setModalMovie(null)}
        />
      )}

      {rerateMovie && (
        <RatingModal
          movie={rerateMovie}
          initialRating={rerateMovie.user_rating}
          onSubmit={(movie, rating) => { setRerateMovie(null); handleRatingSubmit(movie, rating); }}
          onClose={() => setRerateMovie(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          username={username}
          onClose={() => setShowSettings(false)}
          onDeleted={() => { localStorage.clear(); navigate('/'); }}
        />
      )}
    </div>
  );
}

export default RecommendationsPage;
