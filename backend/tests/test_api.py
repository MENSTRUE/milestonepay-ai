import os
from tempfile import TemporaryDirectory
from pathlib import Path

from fastapi.testclient import TestClient
from app import main


def test_request_permissions_and_persistence():
    with TemporaryDirectory() as tmp:
        main.DB_PATH = Path(tmp) / "test.db"
        client = TestClient(main.app)
        assert client.get('/api/v1/health').json()['paypal_connected'] is False
        payload = {"title":"E-commerce Website Redesign","description":"Redesign a responsive e-commerce storefront.","budget_cents":150000,"currency":"USD","freelancer_id":"alex"}
        assert client.post('/api/v1/requests', json=payload, headers={'X-Demo-Actor':'alex'}).status_code == 403
        r = client.post('/api/v1/requests', json=payload, headers={'X-Demo-Actor':'jordan'})
        assert r.status_code == 201
        rid = r.json()['id']
        assert client.get('/api/v1/requests', headers={'X-Demo-Actor':'alex'}).json() == []
        assert client.post(f'/api/v1/requests/{rid}/send', headers={'X-Demo-Actor':'alex'}).status_code == 403
        assert client.post(f'/api/v1/requests/{rid}/send', headers={'X-Demo-Actor':'jordan'}).json()['status'] == 'Sent'
        assert len(client.get('/api/v1/requests', headers={'X-Demo-Actor':'alex'}).json()) == 1
        assert client.post(f'/api/v1/requests/{rid}/send', headers={'X-Demo-Actor':'jordan'}).status_code == 409
        assert client.post('/api/v1/requests',json={**payload,'budget_cents':-5},headers={'X-Demo-Actor':'jordan'}).status_code == 422
