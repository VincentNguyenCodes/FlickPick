from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Movie, Rating, UserProfile
from .tasks import retrain_user_model


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password required.'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=400)

    user = User.objects.create_user(username=username, password=password)
    UserProfile.objects.create(user=user)
    tokens = get_tokens(user)
    return Response({**tokens, 'onboarded': False}, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '')
    password = request.data.get('password', '')
    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'detail': 'Invalid username or password.'}, status=401)

    profile, _ = UserProfile.objects.get_or_create(user=user)
    tokens = get_tokens(user)
    return Response({**tokens, 'onboarded': profile.onboarded})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding(request):
    ratings_data = request.data.get('ratings', {})
    user = request.user

    for tmdb_id_str, rating_val in ratings_data.items():
        try:
            movie = Movie.objects.get(tmdb_id=int(tmdb_id_str))
            Rating.objects.update_or_create(
                user=user, movie=movie,
                defaults={'rating': rating_val}
            )
        except Movie.DoesNotExist:
            pass

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.onboarded = True
    profile.preferred_genres = request.data.get('preferred_genres', [])
    profile.age_range = request.data.get('age_range', '')
    profile.gender = request.data.get('gender', '')
    profile.region = request.data.get('region', '')
    profile.save()

    retrain_user_model.delay(user.id)
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_rating(request):
    movie_id = request.data.get('movie_id')
    rating_val = request.data.get('rating')

    if not movie_id or not rating_val:
        return Response({'error': 'movie_id and rating required.'}, status=400)

    try:
        movie = Movie.objects.get(id=movie_id)
    except Movie.DoesNotExist:
        return Response({'error': 'Movie not found.'}, status=404)

    Rating.objects.update_or_create(
        user=request.user, movie=movie,
        defaults={'rating': rating_val}
    )
    retrain_user_model.delay(request.user.id)
    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    from .ml_model import get_recommendations as ml_recs
    data = ml_recs(request.user, top_k=10)
    return Response({'movies': data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return Response({'status': 'deleted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_animated(request):
    from .ml_model import get_recommendations as ml_recs
    data = ml_recs(request.user, top_k=10, genre='Animation')
    return Response({'movies': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_watched(request):
    ratings = (
        Rating.objects
        .filter(user=request.user)
        .select_related('movie')
        .order_by('-created_at')
    )
    data = [
        {
            'id': r.movie.id,
            'title': r.movie.title,
            'year': r.movie.year,
            'genre': r.movie.genre,
            'director': r.movie.director,
            'cast': r.movie.cast,
            'avg_rating': r.movie.avg_rating,
            'poster': r.movie.poster_url,
            'user_rating': r.rating,
            'watched_at': r.created_at.strftime('%b %d, %Y'),
        }
        for r in ratings
    ]
    return Response({'watched': data})
