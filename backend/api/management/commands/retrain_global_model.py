import os
import torch
from django.core.management.base import BaseCommand
from api.ml_model import train_global_model, compute_all_movie_embeddings

WEIGHTS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', '..', 'ml', 'two_tower_weights.pth'
)


class Command(BaseCommand):
    help = 'Train TwoTowerNet globally on all user-movie ratings and compute movie embeddings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--epochs',
            type=int,
            default=100,
            help='Number of training epochs',
        )

    def handle(self, *args, **options):
        epochs = options['epochs']
        self.stdout.write(f'Training global TwoTowerNet for {epochs} epochs...')

        model = train_global_model(epochs=epochs)
        if model is None:
            self.stderr.write('Not enough data to train. Need at least one user with rated movies.')
            return

        weights_path = os.path.abspath(WEIGHTS_PATH)
        os.makedirs(os.path.dirname(weights_path), exist_ok=True)
        torch.save(model.state_dict(), weights_path)
        self.stdout.write(f'Saved weights to {weights_path}')

        movie_net_state = {
            k.replace('movie_net.', ''): v
            for k, v in model.state_dict().items()
            if k.startswith('movie_net.')
        }
        compute_all_movie_embeddings(movie_net_state)
        self.stdout.write('Movie embeddings computed and stored.')
