import requests
import time

with open('cookie.txt', 'r') as file:
    cookies = [line.strip() for line in file.readlines()]

url = 'https://cm150lytp0000mnbs5qitvejv.iservkmitl.tech/key'
for cookie in cookies:
    # print(cookie)
    data = {
        'key': 'abc123',
        'cookie': cookie
    }

    response = requests.post(url, json=data)

    if response.status_code == 200:
        res = response.json()
    else:
        print(f'Failed to retrieve data. Status code: {response.status_code}, Message: {response.text}')