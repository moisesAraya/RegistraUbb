import requests
from django.http import JsonResponse
from django.shortcuts import render
from django.http import HttpResponse 

# Create your views here.

def index(request):
    return HttpResponse('Hello, world!')

def listar_usuarios(request):
    response = requests.get('http://146.83.194.142:1772/api/users')
    if response.status_code == 200:
        usuarios = response.json()
        return JsonResponse(usuarios, safe=False)
    else:
        return JsonResponse({'error': 'No se pudieron obtener los usuarios'}, status=500)