import json, urllib.request

url = 'http://127.0.0.1:8000/predict'
payload = {'description': 'My meter is burnt'}
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        resp_data = resp.read().decode('utf-8')
        print('Status:', resp.status)
        print('Response:', resp_data)
except Exception as e:
    print('Error:', e)
