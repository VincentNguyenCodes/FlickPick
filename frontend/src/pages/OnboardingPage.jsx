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
  thriller: [
    { id: 680,   title: 'Pulp Fiction', year: 1994, genre: 'Thriller', director: 'Quentin Tarantino', cast: ['John Travolta', 'Uma Thurman', 'Samuel L. Jackson'], rating: 8.9, poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', description: 'The lives of two mob hitmen, a boxer, and a pair of bandits intertwine in four tales of violence and redemption.' },
    { id: 424,   title: "Schindler's List", year: 1993, genre: 'Thriller', director: 'Steven Spielberg', cast: ['Liam Neeson', 'Ralph Fiennes', 'Ben Kingsley'], rating: 9.0, poster: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', description: 'In German-occupied Poland, industrialist Oskar Schindler becomes concerned for his Jewish workforce after witnessing their persecution.' },
    { id: 807,   title: 'Se7en', year: 1995, genre: 'Thriller', director: 'David Fincher', cast: ['Brad Pitt', 'Morgan Freeman', 'Kevin Spacey'], rating: 8.6, poster: 'https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg', description: 'Two detectives hunt a serial killer who uses the seven deadly sins as motives.' },
    { id: 949,   title: 'Zodiac', year: 2007, genre: 'Thriller', director: 'David Fincher', cast: ['Jake Gyllenhaal', 'Mark Ruffalo', 'Robert Downey Jr.'], rating: 7.5, poster: 'https://image.tmdb.org/t/p/w500/e1GB4SqMbJAqhJlrP3AatUAiYpO.jpg', description: 'A San Francisco cartoonist becomes an amateur detective obsessed with the Zodiac killer.' },
    { id: 77338, title: 'The Intouchables', year: 2011, genre: 'Thriller', director: 'Olivier Nakache', cast: ['Francois Cluzet', 'Omar Sy', 'Anne Le Ny'], rating: 8.5, poster: 'https://image.tmdb.org/t/p/w500/1e866QXzi4XKnso6MMlJgE8vMnX.jpg', description: 'After a paragliding accident, a rich man hires a young man from the projects as his caretaker.' },
  ],
  drama: [
    { id: 278,  title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', director: 'Frank Darabont', cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'], rating: 9.3, poster: 'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg', description: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of decency.' },
    { id: 238,  title: 'The Godfather', year: 1972, genre: 'Drama', director: 'Francis Ford Coppola', cast: ['Marlon Brando', 'Al Pacino', 'James Caan'], rating: 9.2, poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLe1rhdVZEuH.jpg', description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.' },
    { id: 13,   title: 'Forrest Gump', year: 1994, genre: 'Drama', director: 'Robert Zemeckis', cast: ['Tom Hanks', 'Robin Wright', 'Gary Sinise'], rating: 8.8, poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', description: 'The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an extraordinary life.' },
    { id: 389,  title: '12 Angry Men', year: 1957, genre: 'Drama', director: 'Sidney Lumet', cast: ['Henry Fonda', 'Lee J. Cobb', 'Martin Balsam'], rating: 9.0, poster: 'https://image.tmdb.org/t/p/w500/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg', description: 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.' },
    { id: 497,  title: 'The Green Mile', year: 1999, genre: 'Drama', director: 'Frank Darabont', cast: ['Tom Hanks', 'Michael Clarke Duncan', 'David Morse'], rating: 8.6, poster: 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg', description: 'The lives of guards on Death Row are affected by one of their charges: a massive man with a mysterious gift.' },
  ],
  crime: [
    { id: 240,    title: 'The Godfather Part II', year: 1974, genre: 'Crime', director: 'Francis Ford Coppola', cast: ['Al Pacino', 'Robert De Niro', 'Robert Duvall'], rating: 9.0, poster: 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg', description: 'The early life of Vito Corleone intercut with the story of his son Michael expanding the family business.' },
    { id: 769,    title: 'GoodFellas', year: 1990, genre: 'Crime', director: 'Martin Scorsese', cast: ['Ray Liotta', 'Robert De Niro', 'Joe Pesci'], rating: 8.7, poster: 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', description: 'The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen.' },
    { id: 103,    title: 'Taxi Driver', year: 1976, genre: 'Crime', director: 'Martin Scorsese', cast: ['Robert De Niro', 'Jodie Foster', 'Cybill Shepherd'], rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/ekstpH614fwDX8DUln1a2Opz0N8.jpg', description: 'A mentally unstable veteran works as a nighttime taxi driver in New York City.' },
    { id: 598,    title: 'City of God', year: 2002, genre: 'Crime', director: 'Fernando Meirelles', cast: ['Alexandre Rodrigues', 'Leandro Firmino', 'Phellipe Haagensen'], rating: 8.6, poster: 'https://image.tmdb.org/t/p/w500/k7eYdWvhYQyRQoU2TB2A2Xu2grZ.jpg', description: 'Two boys growing up in a dangerous neighborhood of Rio de Janeiro take different paths.' },
    { id: 497582, title: 'Knives Out', year: 2019, genre: 'Crime', director: 'Rian Johnson', cast: ['Daniel Craig', 'Ana de Armas', 'Chris Evans'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/pThyQovXQrws2Y4fhB9K5Dq0A6m.jpg', description: 'A detective investigates the death of a patriarch of an eccentric, combative family.' },
  ],
  adventure: [
    { id: 120,   title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, genre: 'Adventure', director: 'Peter Jackson', cast: ['Elijah Wood', 'Ian McKellen', 'Orlando Bloom'], rating: 8.9, poster: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', description: 'A meek hobbit and eight companions set out on a journey to destroy the One Ring.' },
    { id: 85,    title: 'Raiders of the Lost Ark', year: 1981, genre: 'Adventure', director: 'Steven Spielberg', cast: ['Harrison Ford', 'Karen Allen', 'Paul Freeman'], rating: 8.4, poster: 'https://image.tmdb.org/t/p/w500/ceG9VzoRAVGwivFU403Wc3AHRys.jpg', description: 'Archaeologist Indiana Jones races against Nazi Germany to find the legendary Ark of the Covenant.' },
    { id: 329,   title: 'Jurassic Park', year: 1993, genre: 'Adventure', director: 'Steven Spielberg', cast: ['Sam Neill', 'Laura Dern', 'Jeff Goldblum'], rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg', description: 'A pragmatic paleontologist visiting a dinosaur theme park clashes with its creator over ethics.' },
    { id: 37724, title: 'Skyfall', year: 2012, genre: 'Adventure', director: 'Sam Mendes', cast: ['Daniel Craig', 'Javier Bardem', 'Judi Dench'], rating: 7.8, poster: 'https://image.tmdb.org/t/p/w500/xcgNygBNjAqGdN2EhA6AJxCcgep.jpg', description: "Bond's loyalty to M is tested as her past comes back to haunt her." },
    { id: 9806,  title: 'The Incredibles', year: 2004, genre: 'Adventure', director: 'Brad Bird', cast: ['Craig T. Nelson', 'Holly Hunter', 'Samuel L. Jackson'], rating: 8.0, poster: 'https://image.tmdb.org/t/p/w500/2LqaLgk4Z226KkgPJuiOQ58ShKD.jpg', description: 'A family of undercover superheroes tries to live a quiet suburban life but is forced to save the world.' },
  ],
  fantasy: [
    { id: 122,    title: 'The Lord of the Rings: The Return of the King', year: 2003, genre: 'Fantasy', director: 'Peter Jackson', cast: ['Elijah Wood', 'Viggo Mortensen', 'Ian McKellen'], rating: 9.0, poster: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', description: 'Gandalf and Aragorn lead the World of Men against Sauron to draw his gaze from Frodo.' },
    { id: 567,    title: "Harry Potter and the Sorcerer's Stone", year: 2001, genre: 'Fantasy', director: 'Chris Columbus', cast: ['Daniel Radcliffe', 'Emma Watson', 'Rupert Grint'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', description: 'An orphaned boy enrolls in a school of wizardry, where he learns the truth about himself.' },
    { id: 76338,  title: 'Thor: Ragnarok', year: 2017, genre: 'Fantasy', director: 'Taika Waititi', cast: ['Chris Hemsworth', 'Tom Hiddleston', 'Cate Blanchett'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/rzRwTcFvttcN1gjkGy7RUIvzdn.jpg', description: 'Imprisoned on Sakaar, Thor must race against time to return to Asgard and stop Ragnarok.' },
    { id: 4348,   title: "Pan's Labyrinth", year: 2006, genre: 'Fantasy', director: 'Guillermo del Toro', cast: ['Ivana Baquero', 'Ariadna Gil', 'Doug Jones'], rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/htFC6rnq0iqHHyANDqy8bQ8jSFa.jpg', description: 'In fascist Spain, a bookish young stepdaughter escapes into a labyrinthine fantasy world.' },
    { id: 140607, title: 'Star Wars: The Force Awakens', year: 2015, genre: 'Fantasy', director: 'J.J. Abrams', cast: ['Daisy Ridley', 'John Boyega', 'Harrison Ford'], rating: 7.8, poster: 'https://image.tmdb.org/t/p/w500/wqnLdwVXoBjKibFRR5U3y0aDUhs.jpg', description: 'Three decades after the Empire, a new threat arises and a young woman is drawn into conflict.' },
  ],
  war: [
    { id: 857,    title: 'Saving Private Ryan', year: 1998, genre: 'War', director: 'Steven Spielberg', cast: ['Tom Hanks', 'Matt Damon', 'Tom Sizemore'], rating: 8.6, poster: 'https://image.tmdb.org/t/p/w500/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg', description: 'Following the Normandy Landings, a group of U.S. soldiers goes behind enemy lines to retrieve a paratrooper.' },
    { id: 400535, title: '1917', year: 2019, genre: 'War', director: 'Sam Mendes', cast: ['George MacKay', 'Dean-Charles Chapman', 'Mark Strong'], rating: 8.3, poster: 'https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYQLCjyohd.jpg', description: 'Two British soldiers are sent on a dangerous mission to deliver a message that could save 1,600 lives.' },
    { id: 374720, title: 'Dunkirk', year: 2017, genre: 'War', director: 'Christopher Nolan', cast: ['Fionn Whitehead', 'Tom Hardy', 'Mark Rylance'], rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/ebSnODDg9lbsMIaWg2uAbjn7TO5.jpg', description: 'Allied soldiers from Belgium, Britain, Canada and France are surrounded and evacuated during a key WWII battle.' },
    { id: 744,    title: 'Full Metal Jacket', year: 1987, genre: 'War', director: 'Stanley Kubrick', cast: ['Matthew Modine', 'R. Lee Ermey', "Vincent D'Onofrio"], rating: 8.0, poster: 'https://image.tmdb.org/t/p/w500/b1a8TOSJlMGiXpFjZKFNJbGBzxm.jpg', description: 'A two-segment look at the brutality of war: boot camp and Vietnam combat.' },
    { id: 197,    title: 'Braveheart', year: 1995, genre: 'War', director: 'Mel Gibson', cast: ['Mel Gibson', 'Sophie Marceau', 'Patrick McGoohan'], rating: 8.4, poster: 'https://image.tmdb.org/t/p/w500/or1gBugydmjToAEq7OZY0owwFk.jpg', description: 'Scottish warrior William Wallace leads his countrymen in a rebellion against English rule.' },
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
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [region, setRegion] = useState('');
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

  const toggleGenre = (g) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter((x) => x !== g));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const profileComplete = selectedGenres.length >= 1 && ageRange && gender && region;

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
        body: JSON.stringify({
          ratings: finalRatings,
          preferred_genres: selectedGenres,
          age_range: ageRange,
          gender: gender,
          region: region,
        }),
      });
    } catch {
      // proceed even if backend is down during dev
    }
    localStorage.setItem('onboarded', 'true');
    navigate('/recommendations');
  };

  const ratedCount = Object.keys(ratings).length;
  const progress = Math.round((ratedCount / 10) * 100);

  if (step === 1) {
    return (
      <div className="onboarding-page">
        <header className="onboarding-header">
          <Logo size="sm" />
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
        <div className="side-card left">
          {prev && (
            <img src={prev.poster} alt={prev.title} className="side-poster" />
          )}
        </div>

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
