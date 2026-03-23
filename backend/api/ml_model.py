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
