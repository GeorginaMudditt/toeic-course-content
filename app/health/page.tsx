// Health check endpoint - no dependencies
export const dynamic = 'force-dynamic'

export default function HealthPage() {
  const envVars = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Health Check</h1>
      <p>If you can see this page, Next.js is working!</p>
      
      <h2>Environment Variables Status</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Variable</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #ddd' }}>DATABASE_URL</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', color: envVars.hasDatabaseUrl ? 'green' : 'red' }}>
              {envVars.hasDatabaseUrl ? '✓ Set' : '✗ Missing'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #ddd' }}>NEXTAUTH_SECRET</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', color: envVars.hasNextAuthSecret ? 'green' : 'red' }}>
              {envVars.hasNextAuthSecret ? '✓ Set' : '✗ Missing'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #ddd' }}>NEXTAUTH_URL</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', color: envVars.hasNextAuthUrl ? 'green' : 'red' }}>
              {envVars.hasNextAuthUrl ? '✓ Set' : '✗ Missing'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #ddd' }}>NEXT_PUBLIC_SUPABASE_URL</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', color: envVars.hasSupabaseUrl ? 'green' : 'red' }}>
              {envVars.hasSupabaseUrl ? '✓ Set' : '✗ Missing'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #ddd' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', color: envVars.hasSupabaseAnonKey ? 'green' : 'red' }}>
              {envVars.hasSupabaseAnonKey ? '✓ Set' : '✗ Missing'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #ddd' }}>SUPABASE_SERVICE_ROLE_KEY</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', color: envVars.hasSupabaseServiceRole ? 'green' : 'red' }}>
              {envVars.hasSupabaseServiceRole ? '✓ Set' : '✗ Missing'}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px' }}>
        <h3>Next Steps:</h3>
        <ul>
          <li>Any variable marked "✗ Missing" needs to be added to Netlify environment variables</li>
          <li>Go to: Netlify Dashboard → Site Settings → Environment Variables</li>
          <li>After adding variables, trigger a new deploy: Deploys → Trigger deploy → Clear cache and deploy</li>
        </ul>
      </div>
    </div>
  )
}
