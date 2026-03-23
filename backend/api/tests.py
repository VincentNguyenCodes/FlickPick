from django.test import TestCase
from .ml_model import (
    GENRES, NUM_GENRES, GENRE_AFFINITY, EMBEDDING_DIM,
    USER_FEATURE_DIM, MOVIE_FEATURE_DIM, decade_norm, movie_to_vector,
)


class GenreConstantsTest(TestCase):
    def test_genres_count(self):
        self.assertEqual(len(GENRES), 12)
        self.assertEqual(NUM_GENRES, 12)

    def test_genre_affinity_shape(self):
        for genre, row in GENRE_AFFINITY.items():
            self.assertEqual(len(row), 12, f'{genre} affinity row should have 12 values')

    def test_genre_affinity_self_similarity(self):
        for i, genre in enumerate(GENRES):
            self.assertEqual(GENRE_AFFINITY[genre][i], 1.0, f'{genre} self-similarity should be 1.0')


class FeatureEngineeringTest(TestCase):
    def test_decade_norm_range(self):
        self.assertEqual(decade_norm(1920), 0.0)
        self.assertEqual(decade_norm(2020), 1.0)
        self.assertAlmostEqual(decade_norm(1970), 0.5)

    def test_decade_norm_clamp(self):
        self.assertEqual(decade_norm(1800), 0.0)
        self.assertEqual(decade_norm(2100), 1.0)

    def test_user_feature_dim(self):
        self.assertEqual(USER_FEATURE_DIM, 42)

    def test_movie_feature_dim(self):
        self.assertEqual(MOVIE_FEATURE_DIM, 14)
