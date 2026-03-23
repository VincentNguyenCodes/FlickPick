import os
import sys
import django
import urllib.request
import json
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / '.env')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Movie

API_KEY = os.environ.get('TMDB_API_KEY', '')
BASE_URL = 'https://api.themoviedb.org/3'
IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 18: 'Drama', 10751: 'Animation',
    14: 'Fantasy', 36: 'Drama', 27: 'Horror', 10402: 'Drama',
    9648: 'Thriller', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'Drama',
    53: 'Thriller', 10752: 'War', 37: 'Adventure',
}

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

def get_genre(genre_ids):
    for gid in genre_ids:
        if gid in GENRE_MAP:
            return GENRE_MAP[gid]
    return 'Drama'

def get_movie_details(tmdb_id):
    url = f'{BASE_URL}/movie/{tmdb_id}?api_key={API_KEY}&append_to_response=credits'
    data = fetch(url)

    genre_ids = [g['id'] for g in data.get('genres', [])]
    genre = get_genre(genre_ids)

    credits = data.get('credits', {})
    cast = [m['name'] for m in credits.get('cast', [])[:3]]
    crew = credits.get('crew', [])
    directors = [m['name'] for m in crew if m['job'] == 'Director']
    director = directors[0] if directors else 'Unknown'

    poster_path = data.get('poster_path', '')
    poster_url = f'{IMAGE_BASE}{poster_path}' if poster_path else ''

    overview = data.get('overview', '')
    description = overview[:300] if overview else ''

    vote_avg = data.get('vote_average', 0)

    return {
        'tmdb_id': tmdb_id,
        'title': data.get('title', ''),
        'year': int(data.get('release_date', '0000')[:4]) if data.get('release_date') else 0,
        'genre': genre,
        'director': director,
        'cast': cast,
        'avg_rating': round(vote_avg, 1),
        'poster_url': poster_url,
        'description': description,
    }

def main():
    print('Fetching top 1000 movies from TMDB...')
    movie_ids = []
    page = 1

    while len(movie_ids) < 1000:
        url = f'{BASE_URL}/movie/top_rated?api_key={API_KEY}&language=en-US&page={page}'
        data = fetch(url)
        results = data.get('results', [])
        if not results:
            break
        for m in results:
            if m.get('original_language') == 'en' and m.get('poster_path'):
                movie_ids.append(m['id'])
        print(f'  Page {page}: collected {len(movie_ids)} movies so far...')
        page += 1
        time.sleep(0.25)

    movie_ids = movie_ids[:1000]
    print(f'\nFetching details for {len(movie_ids)} movies...')

    created = 0
    updated = 0
    for i, tmdb_id in enumerate(movie_ids):
        try:
            details = get_movie_details(tmdb_id)
            if not details['title'] or not details['poster_url']:
                continue
            _, was_created = Movie.objects.update_or_create(
                tmdb_id=tmdb_id,
                defaults=details
            )
            if was_created:
                created += 1
            else:
                updated += 1
            print(f'  [{i+1}/1000] {details["title"]} ({details["year"]}) - {details["genre"]}')
            time.sleep(0.1)
        except Exception as e:
            print(f'  [{i+1}/1000] ERROR tmdb_id={tmdb_id}: {e}')

    print(f'\nDone! Created: {created}, Updated: {updated}')
    print(f'Total movies in DB: {Movie.objects.count()}')

if __name__ == '__main__':
    main()
