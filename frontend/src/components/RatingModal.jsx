import { useState } from 'react';
import StarRating from './StarRating';
import './RatingModal.css';

function RatingModal({ movie, onSubmit, onClose, initialRating = 0 }) {
  const [rating, setRating] = useState(initialRating);

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
        <p className="modal-subtitle">{initialRating > 0 ? 'Update your rating' : 'How would you rate this?'}</p>
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
