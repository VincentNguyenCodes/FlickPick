import os
import pickle
import base64

import torch
from celery import shared_task
from django.core.cache import cache
from django.contrib.auth.models import User

USER_NET_CACHE_KEY = 'flickpick_user_net_{user_id}'
USER_NET_CACHE_TTL = 86400

WEIGHTS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    'ml', 'two_tower_weights.pth'
)


@shared_task
def retrain_user_model(user_id):
    from .ml_model import MovieNet, train_user_net

    if not os.path.exists(WEIGHTS_PATH):
        return

    checkpoint = torch.load(WEIGHTS_PATH, map_location='cpu')
    movie_net_state = {
        k.replace('movie_net.', ''): v
        for k, v in checkpoint.items()
        if k.startswith('movie_net.')
    }

    user = User.objects.get(id=user_id)
    user_net = train_user_net(user, movie_net_state)

    key = USER_NET_CACHE_KEY.format(user_id=user_id)
    if user_net is not None:
        weights = base64.b64encode(pickle.dumps(user_net.state_dict())).decode()
        cache.set(key, weights, timeout=USER_NET_CACHE_TTL)
    else:
        cache.delete(key)


@shared_task
def retrain_global_model():
    from .ml_model import train_global_model, compute_all_movie_embeddings

    model = train_global_model()
    if model is None:
        return

    os.makedirs(os.path.dirname(WEIGHTS_PATH), exist_ok=True)
    torch.save(model.state_dict(), WEIGHTS_PATH)

    movie_net_state = {
        k.replace('movie_net.', ''): v
        for k, v in model.state_dict().items()
        if k.startswith('movie_net.')
    }
    compute_all_movie_embeddings(movie_net_state)
