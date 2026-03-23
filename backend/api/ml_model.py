import torch
import torch.nn as nn
import numpy as np
from .models import Movie, Rating

GENRES = [
    'Action', 'Thriller', 'Crime', 'Drama', 'Romance',
    'Sci-Fi', 'Comedy', 'Horror', 'Adventure', 'Fantasy', 'War', 'Animation'
]
GENRE_INDEX = {g: i for i, g in enumerate(GENRES)}

AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+']
GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
REGIONS = ['Americas', 'Europe', 'East Asia', 'South/SE Asia', 'Middle East/Africa', 'Oceania']


def decade_norm(year):
    decade = (year // 10) * 10
    return max(0.0, min(1.0, (decade - 1920) / 100.0))


GENRE_AFFINITY = {
    'Action':    [1.0, 0.5, 0.3, 0.0, 0.0, 0.3, 0.0, 0.0, 0.7, 0.0, 0.4, 0.0],
    'Thriller':  [0.5, 1.0, 0.7, 0.3, 0.0, 0.2, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0],
    'Crime':     [0.3, 0.7, 1.0, 0.5, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    'Drama':     [0.0, 0.3, 0.4, 1.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.3, 0.5, 0.0],
    'Romance':   [0.0, 0.0, 0.0, 0.4, 1.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0],
    'Sci-Fi':    [0.3, 0.2, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0],
    'Comedy':    [0.0, 0.0, 0.0, 0.2, 0.3, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.3],
    'Horror':    [0.0, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
    'Adventure': [0.7, 0.0, 0.0, 0.0, 0.0, 0.4, 0.0, 0.0, 1.0, 0.6, 0.3, 0.2],
    'Fantasy':   [0.0, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0, 0.0, 0.3],
    'War':       [0.4, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.3, 0.0, 1.0, 0.0],
    'Animation': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.0, 0.2, 0.3, 0.0, 1.0],
}
