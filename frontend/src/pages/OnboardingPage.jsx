import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import StarRating from '../components/StarRating';
import './OnboardingPage.css';

const ALL_GENRES = [
  'Action', 'Thriller', 'Crime', 'Drama', 'Romance',
  'Sci-Fi', 'Comedy', 'Horror', 'Adventure', 'Fantasy', 'War', 'Animation',
];

const MOVIE_POOL = {
  action: [
    { id: 245891, title: 'John Wick', year: 2014, genre: 'Action', director: 'Chad Stahelski', cast: ['Keanu Reeves', 'Michael Nyqvist', 'Alfie Allen'], rating: 7.4, poster: 'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg', description: 'An ex-hit-man comes out of retirement to track down the gangsters that took everything from him.' },
    { id: 76341,  title: 'Mad Max: Fury Road', year: 2015, genre: 'Action', director: 'George Miller', cast: ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult'], rating: 8.1, poster: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', description: 'In a post-apocalyptic wasteland, Max teams up with Furiosa to flee from a tyrannical warlord.' },
    { id: 155,    title: 'The Dark Knight', year: 2008, genre: 'Action', director: 'Christopher Nolan', cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'], rating: 9.0, poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', description: 'Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy.' },
    { id: 361743, title: 'Top Gun: Maverick', year: 2022, genre: 'Action', director: 'Joseph Kosinski', cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly'], rating: 8.3, poster: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.' },
    { id: 353081, title: 'Mission: Impossible – Fallout', year: 2018, genre: 'Action', director: 'Christopher McQuarrie', cast: ['Tom Cruise', 'Henry Cavill', 'Ving Rhames'], rating: 7.7, poster: 'https://image.tmdb.org/t/p/w500/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg', description: 'Ethan Hunt and his IMF team race against time after a mission gone wrong.' },
    { id: 1724,   title: 'Die Hard', year: 1988, genre: 'Action', director: 'John McTiernan', cast: ['Bruce Willis', 'Alan Rickman', 'Bonnie Bedelia'], rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/yFihWxQcmqcaBR31QM6Y8gT6aYV.jpg', description: 'An NYPD officer tries to save his wife and several others taken hostage by terrorists.' },
  ],
  romance: [
    { id: 11036,  title: 'The Notebook', year: 2004, genre: 'Romance', director: 'Nick Cassavetes', cast: ['Ryan Gosling', 'Rachel McAdams', 'James Garner'], rating: 7.8, poster: 'https://image.tmdb.org/t/p/w500/qom1SZSENdmHFNZBXbtLAGselXK.jpg', description: 'A poor yet passionate young man falls in love with a rich girl, and they fight to be together.' },
    { id: 313369, title: 'La La Land', year: 2016, genre: 'Romance', director: 'Damien Chazelle', cast: ['Ryan Gosling', 'Emma Stone', 'John Legend'], rating: 8.0, poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', description: 'A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.' },
    { id: 597,    title: 'Titanic', year: 1997, genre: 'Romance', director: 'James Cameron', cast: ['Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', description: 'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the Titanic.' },
    { id: 478770, title: 'Crazy Rich Asians', year: 2018, genre: 'Romance', director: 'Jon M. Chu', cast: ['Constance Wu', 'Henry Golding', 'Michelle Yeoh'], rating: 6.9, poster: 'https://image.tmdb.org/t/p/w500/7AX0s3Xlr2mXRMoNqEYfZBifYR9.jpg', description: "A New York professor travels to Singapore for her boyfriend's best friend's wedding." },
    { id: 4348,   title: 'Pride & Prejudice', year: 2005, genre: 'Romance', director: 'Joe Wright', cast: ['Keira Knightley', 'Matthew Macfadyen', 'Rosamund Pike'], rating: 7.8, poster: 'https://image.tmdb.org/t/p/w500/3kbdHBELBkwuS3FShMh9Cxjf8bq.jpg', description: 'Sparks fly when spirited Elizabeth Bennet meets single, rich, and proud Mr. Darcy.' },
    { id: 8470,   title: 'A Walk to Remember', year: 2002, genre: 'Romance', director: 'Adam Shankman', cast: ['Mandy Moore', 'Shane West', 'Peter Coyote'], rating: 7.4, poster: 'https://image.tmdb.org/t/p/w500/lUzHzHFdEkWPbvMtBmLsWLfRjNM.jpg', description: 'The story of two North Carolina teens who come of age through an unlikely romance.' },
  ],
  scifi: [
    { id: 27205,  title: 'Inception', year: 2010, genre: 'Sci-Fi', director: 'Christopher Nolan', cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'], rating: 8.8, poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task.' },
    { id: 157336, title: 'Interstellar', year: 2014, genre: 'Sci-Fi', director: 'Christopher Nolan', cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], rating: 8.6, poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIE.jpg', description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
    { id: 603,    title: 'The Matrix', year: 1999, genre: 'Sci-Fi', director: 'Lana Wachowski', cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'], rating: 8.7, poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', description: 'A hacker discovers reality is a simulation and joins a rebellion against its machine overlords.' },
    { id: 329865, title: 'Arrival', year: 2016, genre: 'Sci-Fi', director: 'Denis Villeneuve', cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg', description: 'A linguist is recruited to communicate with aliens after twelve mysterious spacecraft appear.' },
    { id: 335984, title: 'Blade Runner 2049', year: 2017, genre: 'Sci-Fi', director: 'Denis Villeneuve', cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas'], rating: 8.0, poster: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', description: 'A new blade runner unearths a long-buried secret that could plunge society into chaos.' },
    { id: 264660, title: 'Ex Machina', year: 2014, genre: 'Sci-Fi', director: 'Alex Garland', cast: ['Alicia Vikander', 'Domhnall Gleeson', 'Oscar Isaac'], rating: 7.7, poster: 'https://image.tmdb.org/t/p/w500/btdCGHqX5wkCfkIoqs9xYzB3MXx.jpg', description: 'A programmer is selected to evaluate an AI housed in a humanoid robot.' },
  ],
  comedy: [
    { id: 18785,  title: 'The Hangover', year: 2009, genre: 'Comedy', director: 'Todd Phillips', cast: ['Bradley Cooper', 'Ed Helms', 'Zach Galifianakis'], rating: 7.7, poster: 'https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg', description: 'Three buddies wake up from a bachelor party in Las Vegas with no memory of the previous night.' },
    { id: 8363,   title: 'Superbad', year: 2007, genre: 'Comedy', director: 'Greg Mottola', cast: ['Jonah Hill', 'Michael Cera', 'Emma Stone'], rating: 7.6, poster: 'https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lGHBn5UrS.jpg', description: 'Two co-dependent high school seniors are forced to deal with separation anxiety.' },
    { id: 546554, title: 'Knives Out', year: 2019, genre: 'Comedy', director: 'Rian Johnson', cast: ['Daniel Craig', 'Ana de Armas', 'Chris Evans'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/pThyQovXQrws2Y4fhB9K5Dq0A6m.jpg', description: 'A detective investigates the death of a patriarch of an eccentric, combative family.' },
    { id: 464052, title: 'Game Night', year: 2018, genre: 'Comedy', director: 'John Francis Daley', cast: ['Jason Bateman', 'Rachel McAdams', 'Kyle Chandler'], rating: 7.0, poster: 'https://image.tmdb.org/t/p/w500/fBkBFWfyMfVrxDOcpQVR7cMv0N8.jpg', description: 'A group of friends who meet for a regular game night get entangled in a murder mystery.' },
    { id: 12133,  title: 'Step Brothers', year: 2008, genre: 'Comedy', director: 'Adam McKay', cast: ['Will Ferrell', 'John C. Reilly', 'Mary Steenburgen'], rating: 6.9, poster: 'https://image.tmdb.org/t/p/w500/lRoaVdM9hoJlNi3FDzM4O53s8Wj.jpg', description: 'Two middle-aged man-children are forced to live together when their single parents marry.' },
    { id: 17654,  title: 'Bridesmaids', year: 2011, genre: 'Comedy', director: 'Paul Feig', cast: ['Kristen Wiig', 'Maya Rudolph', 'Rose Byrne'], rating: 6.8, poster: 'https://image.tmdb.org/t/p/w500/kv0j6NuXGsAUFJMNQ8x6OeJHQ9q.jpg', description: "Competition between the maid of honor and a bridesmaid over who is the bride's best friend." },
  ],
  horror: [
    { id: 419430, title: 'Get Out', year: 2017, genre: 'Horror', director: 'Jordan Peele', cast: ['Daniel Kaluuya', 'Allison Williams', 'Bradley Whitford'], rating: 7.7, poster: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', description: "A young Black man visits his white girlfriend's family estate and discovers a disturbing secret." },
    { id: 447332, title: 'A Quiet Place', year: 2018, genre: 'Horror', director: 'John Krasinski', cast: ['Emily Blunt', 'John Krasinski', 'Millicent Simmonds'], rating: 7.5, poster: 'https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg', description: 'A family struggles to survive in a post-apocalyptic world inhabited by blind monsters with an acute sense of hearing.' },
    { id: 493922, title: 'Hereditary', year: 2018, genre: 'Horror', director: 'Ari Aster', cast: ['Toni Collette', 'Alex Wolff', 'Milly Shapiro'], rating: 7.3, poster: 'https://image.tmdb.org/t/p/w500/p9YiKMVyaSrk1M8JVwlC8K0dqpe.jpg', description: 'A grieving family is haunted by tragic and disturbing occurrences after the death of their grandmother.' },
    { id: 694,    title: 'The Shining', year: 1980, genre: 'Horror', director: 'Stanley Kubrick', cast: ['Jack Nicholson', 'Shelley Duvall', 'Danny Lloyd'], rating: 8.4, poster: 'https://image.tmdb.org/t/p/w500/nRj5511mZdTl4saWEPoj9QroTIu.jpg', description: 'A family heads to an isolated hotel for the winter where a sinister presence drives the father into madness.' },
    { id: 458156, title: 'Us', year: 2019, genre: 'Horror', director: 'Jordan Peele', cast: ["Lupita Nyong'o", 'Winston Duke', 'Elisabeth Moss'], rating: 6.8, poster: 'https://image.tmdb.org/t/p/w500/ux2maANBnhEQQOCPDMGd2CzCuHx.jpg', description: "A family's vacation turns terrifying when they discover sinister doppelgängers of themselves." },
    { id: 530385, title: 'Midsommar', year: 2019, genre: 'Horror', director: 'Ari Aster', cast: ['Florence Pugh', 'Jack Reynor', 'William Jackson Harper'], rating: 7.1, poster: 'https://image.tmdb.org/t/p/w500/7LEI8ulZzO5gy9Ww2NVCrKmHeDZ.jpg', description: 'A couple travels to Sweden to attend a midsummer festival that devolves into something sinister.' },
  ],
  animation: [
    { id: 324857, title: 'Spider-Man: Into the Spider-Verse', year: 2018, genre: 'Animation', director: 'Bob Persichetti', cast: ['Shameik Moore', 'Jake Johnson', 'Hailee Steinfeld'], rating: 8.4, poster: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', description: 'Teen Miles Morales becomes Spider-Man of his universe and must stop a threat across the multiverse.' },
    { id: 8587,   title: 'The Lion King', year: 1994, genre: 'Animation', director: 'Roger Allers', cast: ['Matthew Broderick', 'Moira Kelly', 'Nathan Lane'], rating: 8.3, poster: 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', description: 'A lion cub prince flees his kingdom after the murder of his father, only to learn the true meaning of responsibility.' },
    { id: 354912, title: 'Coco', year: 2017, genre: 'Animation', director: 'Lee Unkrich', cast: ['Anthony Gonzalez', 'Gael García Bernal', 'Benjamin Bratt'], rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg', description: 'Aspiring musician Miguel enters the Land of the Dead to find his great-great-grandfather.' },
    { id: 315162, title: 'Puss in Boots: The Last Wish', year: 2022, genre: 'Animation', director: 'Joel Crawford', cast: ['Antonio Banderas', 'Salma Hayek Pinault', 'Harvey Guillén'], rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/kuf6dutpsT0vSVehic3EZIqkOBt.jpg', description: 'Puss in Boots discovers his passion for adventure has taken a toll: he has burned through eight of his nine lives.' },
    { id: 10681,  title: 'WALL·E', year: 2008, genre: 'Animation', director: 'Andrew Stanton', cast: ['Ben Burtt', 'Elissa Knight', 'Jeff Garlin'], rating: 8.1, poster: 'https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg', description: 'A robot tasked with cleaning a waste-covered Earth falls in love and goes on a galaxy-spanning adventure.' },
    { id: 1184918, title: 'The Wild Robot', year: 2024, genre: 'Animation', director: 'Chris Sanders', cast: ["Lupita Nyong'o", 'Pedro Pascal', 'Kit Connor'], rating: 8.3, poster: 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg', description: 'A robot shipwrecked on a wild island must adapt to her surroundings and befriend the animals to survive.' },
  ],
};

function buildQueue() {
  const queue = [];
  Object.entries(MOVIE_POOL).forEach(([category, movies]) => {
    queue.push({ ...movies[0], category, poolIndex: 1 });
    queue.push({ ...movies[1], category, poolIndex: 2 });
  });
  return queue;
}

function OnboardingPage() {
  const [queue, setQueue] = useState(buildQueue());
  const [current, setCurrent] = useState(0);
  const [totalShown, setTotalShown] = useState(10);
  const [ratings, setRatings] = useState({});
  const [selectedRating, setSelectedRating] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const movie = queue[current];
  const prev = queue[current - 1];
  const next = queue[current + 1];

  const handleRate = () => {
    if (selectedRating === 0) return;
    const newRatings = { ...ratings, [movie.id]: selectedRating };
    setRatings(newRatings);
    setSelectedRating(0);
    setScrolled(false);
    goNext(newRatings);
  };

  const handleNeverSeen = () => {
    const category = movie.category;
    const pool = MOVIE_POOL[category];
    const nextPoolIndex = movie.poolIndex + 1;

    let newQueue = [...queue];
    if (totalShown < 20 && nextPoolIndex < pool.length) {
      const newMovie = { ...pool[nextPoolIndex], category, poolIndex: nextPoolIndex };
      newQueue = [...queue, newMovie];
    }

    setQueue(newQueue);
    setTotalShown(totalShown + 1);
    setSelectedRating(0);
    setScrolled(false);
    goNext(ratings, newQueue);
  };

  const goNext = (currentRatings, currentQueue = queue) => {
    const nextIndex = current + 1;
    if (nextIndex >= currentQueue.length || Object.keys(currentRatings).length >= 10) {
      finishOnboarding(currentRatings);
    } else {
      setCurrent(nextIndex);
    }
  };

  const finishOnboarding = async (finalRatings) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/onboarding/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ratings: finalRatings }),
      });
    } catch {
      // proceed even if backend is down during dev
    }
    localStorage.setItem('onboarded', 'true');
    navigate('/recommendations');
  };

  const ratedCount = Object.keys(ratings).length;
  const progress = Math.round((ratedCount / 10) * 100);

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <Logo size="sm" />
        <div className="progress-info">
          <span>{ratedCount} / 10 rated</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <p className="onboarding-subtitle">
        Rate movies you've seen so we can learn your taste.
      </p>

      <div className="carousel-wrapper">
        {/* Left blurred card */}
        <div className="side-card left">
          {prev && (
            <img src={prev.poster} alt={prev.title} className="side-poster" />
          )}
        </div>

        {/* Center card */}
        <div className="center-card" onScroll={(e) => setScrolled(e.target.scrollTop > 40)}>
          <div className="poster-wrapper">
            <img src={movie.poster} alt={movie.title} className="center-poster" />
            <div className={`details-overlay ${scrolled ? 'visible' : ''}`}>
              <h2 className="movie-title">{movie.title} <span className="movie-year">({movie.year})</span></h2>
              <span className="genre-badge">{movie.genre}</span>
              <p className="movie-desc">{movie.description}</p>
              <div className="meta-row">
                <span className="meta-label">Director</span>
                <span className="meta-value">{movie.director}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Cast</span>
                <span className="meta-value">{movie.cast.join(', ')}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">TMDB Rating</span>
                <span className="meta-value accent">★ {movie.rating}</span>
              </div>
            </div>
          </div>

          <div className="scroll-hint" style={{ opacity: scrolled ? 0 : 1 }}>
            ↓ scroll for details
          </div>

          <div className="rating-section">
            <StarRating value={selectedRating} onChange={setSelectedRating} />
            <div className="action-btns">
              <button
                className="rate-btn"
                onClick={handleRate}
                disabled={selectedRating === 0 || submitting}
              >
                Rate & Continue
              </button>
              <button className="never-btn" onClick={handleNeverSeen} disabled={submitting}>
                Never Seen This
              </button>
            </div>
          </div>
        </div>

        {/* Right blurred card */}
        <div className="side-card right">
          {next && (
            <img src={next.poster} alt={next.title} className="side-poster" />
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
