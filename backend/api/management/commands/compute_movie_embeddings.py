import os
import torch
from django.core.management.base import BaseCommand
from api.ml_model import MovieNet, compute_all_movie_embeddings

WEIGHTS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', '..', 'ml', 'two_tower_weights.pth'
)


class Command(BaseCommand):
    help = 'Compute and store 32-dim MovieNet embeddings for all movies'

    def add_arguments(self, parser):
        parser.add_argument(
            '--weights',
            type=str,
            default=WEIGHTS_PATH,
            help='Path to two_tower_weights.pth',
        )

    def handle(self, *args, **options):
        weights_path = os.path.abspath(options['weights'])
        if not os.path.exists(weights_path):
            self.stderr.write(f'Weights file not found: {weights_path}')
            return

        checkpoint = torch.load(weights_path, map_location='cpu')
        movie_net_state = {
            k.replace('movie_net.', ''): v
            for k, v in checkpoint.items()
            if k.startswith('movie_net.')
        }

        from api.models import Movie
        count_before = Movie.objects.filter(embedding__isnull=True).count()
        compute_all_movie_embeddings(movie_net_state)
        count_after = Movie.objects.filter(embedding__isnull=True).count()
        total = Movie.objects.count()
        self.stdout.write(f'Done. {total} movies processed, {count_before - count_after} embeddings newly written.')
