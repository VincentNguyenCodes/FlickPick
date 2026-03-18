import pickle
import base64

from celery import shared_task
from django.core.cache import cache
from django.contrib.auth.models import User

MODEL_CACHE_KEY = 'flickpick_model_{user_id}'
MODEL_CACHE_TTL = 86400  # 24 hours


@shared_task
def retrain_user_model(user_id):
    """
    Retrain the recommendation model for a user and cache the weights in Redis.
    Triggered asynchronously after a rating is submitted.
    """
    from .ml_model import train_model, RecommenderNet

    user = User.objects.get(id=user_id)
    model = train_model(user)

    key = MODEL_CACHE_KEY.format(user_id=user_id)
    if model is not None:
        weights = base64.b64encode(pickle.dumps(model.state_dict())).decode()
        cache.set(key, weights, timeout=MODEL_CACHE_TTL)
    else:
        cache.delete(key)
