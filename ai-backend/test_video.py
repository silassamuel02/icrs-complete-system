import json, urllib.request, os

url = 'http://127.0.0.1:8000/detect/video-frame'
image_path = os.path.join(os.path.dirname(__file__), 'fire_test_image.png')
with open(image_path, 'rb') as f:
    data = f.read()
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'image/png'}, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        resp_data = resp.read().decode('utf-8')
        print('Status:', resp.status)
        print('Response:', resp_data)
except Exception as e:
    print('Error:', e)
