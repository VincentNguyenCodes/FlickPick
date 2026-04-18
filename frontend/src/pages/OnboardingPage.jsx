import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import StarRating from '../components/StarRating';
import './OnboardingPage.css';

const ALL_GENRES = [
  'Action', 'Thriller', 'Crime', 'Drama', 'Romance',
  'Sci-Fi', 'Comedy', 'Horror', 'Adventure', 'Fantasy', 'War', 'Animation',
];

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [region, setRegion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [pendingRating, setPendingRating] = useState(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const toggleGenre = (g) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter((x) => x !== g));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const profileComplete = selectedGenres.length >= 1 && ageRange && gender && region;

  useEffect(() => {
    if (step !== 2) return;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/movies/search/?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const ratedIds = new Set(ratedMovies.map((m) => m.tmdb_id));
        setSearchResults(data.filter((m) => !ratedIds.has(m.tmdb_id)));
      } catch {}
      setSearching(false);
    }, 300);
  }, [searchQuery, step]);

  const handleSelectMovie = (movie) => {
    setPendingRating(movie.tmdb_id);
  };

  const handleRate = (movie, rating) => {
    setRatedMovies((prev) => [...prev, { ...movie, rating }]);
    setSearchResults((prev) => prev.filter((m) => m.tmdb_id !== movie.tmdb_id));
    setPendingRating(null);
  };

  const handleRemoveRated = (tmdbId) => {
    setRatedMovies((prev) => prev.filter((m) => m.tmdb_id !== tmdbId));
  };

  const finishOnboarding = async () => {
    setSubmitting(true);
    const ratingsPayload = {};
    ratedMovies.forEach((m) => { ratingsPayload[m.tmdb_id] = m.rating; });
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/onboarding/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ratings: ratingsPayload,
          movies_data: {},
          preferred_genres: selectedGenres,
          age_range: ageRange,
          gender: gender,
          region: region,
        }),
      });
    } catch {}
    localStorage.setItem('onboarded', 'true');
    navigate('/recommendations');
  };

  if (step === 1) {
    return (
      <div className="onboarding-page">
        <header className="onboarding-header">
          <Logo size="sm" />
          <div className="step-indicator">
            <span className="step-dot active" />
            <span className="step-dot" />
          </div>
        </header>
        <div className="profile-step">
          <h1 className="profile-title">Tell us about yourself</h1>
          <p className="profile-subtitle">This helps us build better recommendations from day one.</p>

          <div className="profile-section">
            <label className="profile-section-label">Favorite genres <span className="profile-hint">(pick up to 3)</span></label>
            <div className="genre-chips">
              {ALL_GENRES.map((g) => (
                <button
                  key={g}
                  className={`genre-chip ${selectedGenres.includes(g) ? 'selected' : ''} ${selectedGenres.length >= 3 && !selectedGenres.includes(g) ? 'maxed' : ''}`}
                  onClick={() => toggleGenre(g)}
                  type="button"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <label>Age range</label>
              <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                <option value="">Select...</option>
                {['13-17', '18-24', '25-34', '35-44', '45-54', '55+'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select...</option>
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label>Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">Select...</option>
                {['Americas', 'Europe', 'East Asia', 'South/SE Asia', 'Middle East/Africa', 'Oceania'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="continue-btn"
            disabled={!profileComplete}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <Logo size="sm" />
        <div className="step-indicator">
          <span className="step-dot" />
          <span className="step-dot active" />
        </div>
      </header>

      <div className="search-step">
        <h1 className="profile-title">Rate movies you've seen</h1>
        <p className="profile-subtitle">Search for movies you know and rate them to train your taste profile.</p>

        <div className="movie-search-wrapper">
          <input
            className="movie-search-input"
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searching && <span className="search-searching">Searching...</span>}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results-grid">
            {searchResults.map((movie) => (
              <div
                key={movie.tmdb_id}
                className={`search-result-card ${pendingRating === movie.tmdb_id ? 'active' : ''}`}
                onClick={() => handleSelectMovie(movie)}
              >
                <img src={movie.poster_url} alt={movie.title} className="search-result-poster" />
                <div className="search-result-info">
                  <span className="search-result-title">{movie.title}</span>
                  <span className="search-result-year">{movie.year}</span>
                </div>
                {pendingRating === movie.tmdb_id && (
                  <div className="inline-rating" onClick={(e) => e.stopPropagation()}>
                    <p className="inline-rating-label">Your rating</p>
                    <StarRating value={0} onChange={(rating) => handleRate(movie, rating)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p className="search-empty">No movies found. Try a different title.</p>
        )}

        {ratedMovies.length > 0 && (
          <div className="rated-section">
            <p className="rated-label">Rated ({ratedMovies.length}/10)</p>
            <div className="rated-list">
              {ratedMovies.map((movie) => (
                <div key={movie.tmdb_id} className="rated-card">
                  <img src={movie.poster_url} alt={movie.title} className="rated-poster" />
                  <div className="rated-info">
                    <span className="rated-title">{movie.title}</span>
                    <StarRating value={movie.rating} readOnly />
                  </div>
                  <button className="rated-remove" onClick={() => handleRemoveRated(movie.tmdb_id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="continue-btn"
          disabled={ratedMovies.length < 10 || submitting}
          onClick={finishOnboarding}
        >
          {submitting ? 'Saving...' : `Finish${ratedMovies.length < 10 ? ` (${ratedMovies.length}/10)` : ''}`}
        </button>
      </div>
    </div>
  );
}

export default OnboardingPage;
