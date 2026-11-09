# Optional AG Grid Community module

This integration is not enabled in the default zero-dependency MVP because offline CI cannot fetch npm packages. The default `InvoiceAnalytics.tsx` works with React only.

To install and activate on Windows PowerShell (in repository root):

```powershell
npm install ag-grid-react ag-grid-community
Copy-Item sponsors/ag-grid/AGGridInvoiceAnalytics.tsx src/AGGridInvoiceAnalytics.tsx
(Get-Content src/AGGridInvoiceAnalytics.tsx -Raw).Replace("from '../../src/api/commerce'", "from './api/commerce'") | Set-Content src/AGGridInvoiceAnalytics.tsx -Encoding UTF8
(Get-Content src/AGGridInvoiceAnalytics.tsx -Raw).Replace("from '../../src/api/commerce'", "from './api/commerce'") | Set-Content src/AGGridInvoiceAnalytics.tsx -Encoding UTF8
# Edit src/Workspace.tsx to use AGGridInvoiceAnalytics instead of InvoiceAnalytics.
npx tsc --noEmit
npm run build
```

Do not claim an AG Grid sponsor award entry until the module is visibly enabled and its use meets the competition's sponsor category requirements.
