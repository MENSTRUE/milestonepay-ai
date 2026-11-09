"""Minimal persistence and permission regression test for the MVP."""
from pathlib import Path
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient
from app import main

def test_request_permissions_and_persistence():
    with TemporaryDirectory() as tmp:
        main.DB_PATH=Path(tmp)/'test.db'
        c=TestClient(main.app)
        payload={'title':'Landing Page Build','description':'Build an accessible landing page for a small business','budget_cents':150000,'currency':'USD','freelancer_id':'alex'}
        assert c.post('/api/v1/requests',headers={'X-Demo-Actor':'alex'},json=payload).status_code==403
        r=c.post('/api/v1/requests',headers={'X-Demo-Actor':'jordan'},json=payload)
        assert r.status_code==201, r.text
        rid=r.json()['id']
        assert c.get('/api/v1/requests',headers={'X-Demo-Actor':'alex'}).json()==[]
        assert c.post(f'/api/v1/requests/{rid}/send',headers={'X-Demo-Actor':'alex'}).status_code==403
        assert c.post(f'/api/v1/requests/{rid}/send',headers={'X-Demo-Actor':'jordan'}).status_code==200
        assert len(c.get('/api/v1/requests',headers={'X-Demo-Actor':'alex'}).json())==1
        assert len(c.get('/api/v1/requests',headers={'X-Demo-Actor':'jordan'}).json())==1
