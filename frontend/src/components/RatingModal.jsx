import { useState } from 'react';
import StarRating from './StarRating';
import './RatingModal.css';

function RatingModal({ movie, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(movie, rating);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <img
          src={movie.poster}
          alt={movie.title}
          className="modal-poster"
        />
        <h2 className="modal-title">{movie.title}</h2>
        <p className="modal-subtitle">How would you rate this?</p>
        <StarRating value={rating} onChange={setRating} />
        <button
          className={`modal-btn ${rating > 0 ? 'active' : ''}`}
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          Submit Rating
        </button>
      </div>
    </div>
  );
}

export default RatingModal;
