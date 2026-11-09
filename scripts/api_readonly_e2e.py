"""Read-only local FastAPI integrity probe; never creates or syncs PayPal invoices.
No secrets, personal emails, invoice IDs or project evidence are printed.
"""
from __future__ import annotations
import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def get(base: str, endpoint: str, persona: str|None=None):
    headers={'Accept':'application/json'}
    if persona: headers['X-Demo-Actor']=persona
    req=urllib.request.Request(base+endpoint,headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=8) as resp:
            return resp.status,json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code,{}


def main(base: str, out:Path) -> int:
    checks=[]
    def record(label, ok, desc=''):
        checks.append({'check':label,'passed':bool(ok),'detail':desc})
        print(f"[{'PASS' if ok else 'FAIL'}] {label}" + (f': {desc}' if desc else ''))
    try:
        status,health=get(base,'/api/v1/health')
        record('API health',status==200 and health.get('status')=='ok')
        unauthorized,_=get(base,'/api/v1/requests')
        record('Missing persona denied',unauthorized in (400,401,403))
        wrong,_=get(base,'/api/v1/requests','unknown')
        record('Unknown persona denied',wrong in (400,401,403))
        for persona in ('jordan','alex'):
            state,requests=get(base,'/api/v1/requests',persona)
            valid=state==200 and isinstance(requests,list)
            record(f'{persona} project list',valid,f'{len(requests) if valid else 0} records (no IDs logged)')
            if not valid: continue
            invoice_count=0; paid_count=0; audits=0
            for r in requests:
                rid=r.get('id')
                if not isinstance(rid,str):
                    record(f'{persona} valid project ID',False)
                    continue
                state,invoice_rows=get(base,f'/api/v1/requests/{rid}/invoices',persona)
                if state!=200 or not isinstance(invoice_rows,list):
                    record(f'{persona} invoice history API',False)
                    continue
                invoice_count += len(invoice_rows)
                for inv in invoice_rows:
                    if inv.get('status')=='PAID':
                        paid_count+=1
                        record(f'{persona} PAID invoice is sandbox-labeled',inv.get('sandbox') is True)
                state,audit=get(base,f'/api/v1/requests/{rid}/audit',persona)
                if state == 200 and isinstance(audit,dict):
                    audits+=1
                    record(f'{persona} hash chain intact',audit.get('verified_hash_chain') is True)
            print(f'[INFO] {persona}: invoices={invoice_count}, PAID={paid_count}, readable_audit_chains={audits} (read-only SQLite snapshots, not live PayPal verification)')
    except (urllib.error.URLError,TimeoutError,ValueError,OSError) as e:
        record('Local API reachable',False,type(e).__name__)
    out.mkdir(parents=True,exist_ok=True)
    data={'generated_utc':datetime.now(timezone.utc).isoformat(),'mode':'read-only FastAPI inspection', 'checks':checks,
          'disclaimer':'PAID values are last saved provider sync, not fresh PayPal requests. No PayPal API call executed.'}
    (out/'api_readonly_e2e.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
    bad=sum(not x['passed'] for x in checks)
    print(f'API smoke: {len(checks)-bad} PASS; {bad} FAIL')
    return 0 if len(checks)>=5 and bad==0 else 1

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--base',default='http://127.0.0.1:8000')
    parser.add_argument('--output',type=Path,default=Path.home()/'MilestonePay-Audit-Reports'/'api')
    args=parser.parse_args()
    sys.exit(main(args.base.rstrip('/'),args.output))
