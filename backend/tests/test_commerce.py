from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from fastapi.testclient import TestClient
from app import main

J = {"X-Demo-Actor":"jordan"}
A = {"X-Demo-Actor":"alex"}
PAYLOAD = {"title":"E-commerce Redesign", "description":"Build a modern responsive web storefront", "budget_cents":150000, "currency":"USD", "freelancer_id":"alex"}
PROPOSAL = {"scope":"Design and implement an online storefront", "amount_cents":150000,"currency":"USD", "timeline":"November 2026", "assumptions":"Assets supplied", "revisions":"Two rounds", "milestones":[{"title":"Design", "amount_cents":45000,"acceptance_criteria":"Accessible desktop/mobile design", "due_date":"2026-11-10"}, {"title":"Frontend", "amount_cents":105000,"acceptance_criteria":"Responsive working frontend", "due_date":"2026-11-12"}]}


def test_complete_workflow_and_paypal_mock():
    with TemporaryDirectory() as tmp:
        main.DB_PATH=Path(tmp)/"db.sqlite"
        c=TestClient(main.app)
        h=c.get('/api/v1/health').json()
        assert h['paypal_connected'] is False
        rid=c.post('/api/v1/requests',headers=J,json=PAYLOAD).json()['id']
        assert c.post(f'/api/v1/requests/{rid}/send',headers=J).status_code==200
        assert c.post(f'/api/v1/requests/{rid}/proposals',headers=J,json=PROPOSAL).status_code==403
        res=c.post(f'/api/v1/requests/{rid}/proposals',headers=A,json=PROPOSAL)
        assert res.status_code==201, res.text
        mid=res.json()['milestones'][0]['id']
        assert c.post(f'/api/v1/requests/{rid}/proposals/accept',headers=J).status_code==201
        assert c.post(f'/api/v1/requests/{rid}/agreement/confirm',headers=A).json()['active'] is True
        assert c.post(f'/api/v1/requests/{rid}/milestones/{mid}/submit',headers=A,json={'evidence':'Figma link and annotated screenshots of responsive pages'}).status_code==200
        assert c.post(f'/api/v1/requests/{rid}/milestones/{mid}/review',headers=A,json={'approve':True,'feedback':'Looks good'}).status_code==403
        assert c.post(f'/api/v1/requests/{rid}/milestones/{mid}/review',headers=J,json={'approve':True,'feedback':'Looks good'}).json()['status']=='Approved'
        assert c.post('/api/v1/agent/plan',headers=J,json={'request_id':rid}).status_code==503
        with patch('app.paypal.require_config'),patch('app.paypal.create_invoice',return_value={'id':'INV2-TEST','status':'DRAFT'}),patch('app.paypal.send_invoice'),patch('app.paypal.get_invoice',return_value={'status':'UNPAID'}):
            assert c.post('/api/v1/paypal/invoices',headers=J,json={'request_id':rid,'milestone_id':mid,'payer_email':'jordan@example.test'}).status_code==403
            r=c.post('/api/v1/paypal/invoices',headers=A,json={'request_id':rid,'milestone_id':mid,'payer_email':'jordan@example.test'})
            assert r.status_code==201,r.text
            assert r.json()['paypal_id']=='INV2-TEST'
            assert c.post('/api/v1/paypal/invoices',headers=A,json={'request_id':rid,'milestone_id':mid,'payer_email':'jordan@example.test'}).status_code==409
            assert c.post('/api/v1/paypal/invoices/INV2-TEST/send',headers=A).json()['status']=='UNPAID'
            assert c.get('/api/v1/paypal/invoices/INV2-TEST/sync',headers=J).json()['paid'] is False
        audit=c.get(f'/api/v1/requests/{rid}/audit',headers=J).json()
        assert audit['verified_hash_chain'] is True
        assert len(audit['events'])>=2


def test_ai_plan_mocked_provider_and_hash_tamper():
    with TemporaryDirectory() as tmp:
        main.DB_PATH=Path(tmp)/'db.sqlite'
        c=TestClient(main.app)
        rid=c.post('/api/v1/requests',headers=J,json=PAYLOAD).json()['id']
        from app.ai_service import AgreementPlan
        planned=AgreementPlan(summary='E-commerce',ambiguities=['breakpoints'],suggestions=['clarify'],milestones=[
            {'title':'Design','amount_cents':45000,'acceptance_criteria':'Desktop and mobile previews','due_date':'2026-11-10'},
            {'title':'Frontend','amount_cents':105000,'acceptance_criteria':'Responsive pages and tests','due_date':'2026-11-12'}])
        with patch('app.ai_service.run_structured',return_value=planned):
            result=c.post('/api/v1/agent/plan',headers=J,json={'request_id':rid})
            assert result.status_code==200,result.text
            assert result.json()['requires_human_approval'] is True
        assert c.get(f'/api/v1/requests/{rid}/audit',headers=J).json()['verified_hash_chain'] is True
        with main.db() as con:
            con.execute('UPDATE audit_events SET payload=? WHERE request_id=?', ('{"tampered":true}',rid))
        assert c.get(f'/api/v1/requests/{rid}/audit',headers=J).json()['verified_hash_chain'] is False


def test_invoice_history_reloads_and_respects_demo_membership():
    with TemporaryDirectory() as tmp:
        main.DB_PATH = Path(tmp) / "test-invoices.db"
        c = TestClient(main.app)
        first = c.post("/api/v1/requests", headers=J, json=PAYLOAD).json()["id"]
        second = c.post("/api/v1/requests", headers=J, json=PAYLOAD).json()["id"]
        c.post(f"/api/v1/requests/{first}/send", headers=J)
        created = c.post(f"/api/v1/requests/{first}/proposals", headers=A, json=PROPOSAL)
        assert created.status_code == 201
        milestone_id = created.json()["milestones"][0]["id"]
        c.post(f"/api/v1/requests/{first}/proposals/accept", headers=J)
        c.post(f"/api/v1/requests/{first}/agreement/confirm", headers=A)
        c.post(f"/api/v1/requests/{first}/milestones/{milestone_id}/submit", headers=A, json={"evidence":"Annotated screenshots and demo links"})
        c.post(f"/api/v1/requests/{first}/milestones/{milestone_id}/review", headers=J, json={"approve":True,"feedback":"Approved for demo"})
        with patch('app.paypal.require_config'), patch('app.paypal.create_invoice', return_value={'id':'INV2-TEST','status':'DRAFT'}):
            created_invoice = c.post('/api/v1/paypal/invoices', headers=A, json={
                'request_id': first, 'milestone_id': milestone_id, 'payer_email':'sandbox@personal.example.com'
            })
            assert created_invoice.status_code == 201, created_invoice.text
        response = c.get(f"/api/v1/requests/{first}/invoices", headers=J)
        assert response.status_code == 200, response.text
        assert response.json()[0]["paypal_id"] == "INV2-TEST"
        assert response.json()[0]["paid"] is False
        assert c.get(f"/api/v1/requests/{second}/invoices", headers=J).json() == []
        assert c.get(f"/api/v1/requests/{first}/invoices", headers=A).status_code == 200
        assert c.get(f"/api/v1/requests/{second}/invoices", headers={"X-Demo-Actor":"unknown"}).status_code == 400
