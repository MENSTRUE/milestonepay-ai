/** OPTIONAL AG Grid Community enhancement.
 * To activate: install ag-grid-react ag-grid-community, copy to src/AGGridInvoiceAnalytics.tsx,
 * then import it instead of InvoiceAnalytics in src/Workspace.tsx.
 * Requires verification of the hackathon's exact AG Grid prize rules.
 */
import {useEffect,useState,useMemo} from 'react'
import {AgGridReact} from 'ag-grid-react'
import {AllCommunityModule,ModuleRegistry} from 'ag-grid-community'
import type {ColDef} from 'ag-grid-community'
import {commerce} from '../../src/api/commerce'
import type {Actor,InvoiceResult,RequestRecord} from '../../src/api/commerce'
ModuleRegistry.registerModules([AllCommunityModule])
type TableRow={project:string, invoice_id:string,status:string,amount_cents:number,request_id:string}
export default function AGGridInvoiceAnalytics({actor,lang}:{actor:Actor,lang:'id'|'en'}){
 const [data,setData]=useState<TableRow[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [query,setQuery]=useState('')
 useEffect(()=>{let live=true;setLoading(true);setError('');void (async()=>{try{const projects:RequestRecord[]=await commerce.list(actor);const groups=await Promise.all(projects.map(async p=>{const invoices:InvoiceResult[]=await commerce.invoices(actor,p.id);return invoices.map(i=>({project:p.title,invoice_id:i.paypal_id,status:i.status,amount_cents:i.amount_cents??0,request_id:p.id}))}));if(live)setData(groups.flat())}catch(e){if(live)setError(e instanceof Error?e.message:String(e))}finally{if(live)setLoading(false)}})();return()=>{live=false}},[actor])
 const columns=useMemo<ColDef<TableRow>[]>(()=>[
  {field:'project',headerName:lang==='id'?'Proyek':'Project',filter:true,flex:2,minWidth:160},
  {field:'invoice_id',headerName:'PayPal Invoice ID',filter:true,flex:2,minWidth:230},
  {field:'status',headerName:'Status',filter:true,flex:1},
  {field:'amount_cents',headerName:lang==='id'?'Nominal Sandbox (USD)':'Sandbox amount (USD)',valueFormatter:p=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((p.value??0)/100),filter:'agNumberColumnFilter',flex:1},
 ],[lang])
 const totalPaid=data.filter(r=>r.status==='PAID').reduce((x,r)=>x+r.amount_cents,0)
 return <section className="mp-card">
  <h2>{lang==='id'?'Analitik AG Grid · Invoice PayPal Sandbox':'AG Grid analytics · PayPal Sandbox invoices'}</h2>
  <p>{lang==='id'?'Tabel menggunakan AG Grid Community dengan filter, sort, halaman dan pencarian. Pembayaran virtual saja.':'AG Grid Community supports search, sorting, filtering and pagination. Virtual funds only.'}</p>
  <div className="mp-metrics"><div className="mp-metric"><small>Invoices</small><strong>{data.length}</strong></div><div className="mp-metric"><small>Verified PAID Sandbox</small><strong>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(totalPaid/100)}</strong></div></div>
  <input className="mp-filter" aria-label="Search grid" placeholder={lang==='id'?'Cari dalam tabel':'Search the grid'} value={query} onChange={e=>setQuery(e.target.value)}/>
  {error&&<div role="alert" className="mp-warning">{error}</div>}
  <div style={{width:'100%',height:450,marginTop:14}}><AgGridReact rowData={data} columnDefs={columns} quickFilterText={query} pagination paginationPageSize={10} loading={loading} defaultColDef={{sortable:true,resizable:true}}/></div>
 </section>
}
