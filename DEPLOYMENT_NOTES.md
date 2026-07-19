# Deployment Notes

## Vercel readiness
- The app builds successfully with Vite.
- Routing is configured for client-side navigation via vercel.json.
- Supabase is now initialized safely even when environment variables are not yet set.

## Required environment variables for production
Set these in Vercel > Project Settings > Environment Variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_USE_MOCK_AUTH=false

## Important note
If Supabase is not configured, the app will use the mock-auth fallback so the UI remains usable in preview deployments. For full backend functionality, connect the project to a real Supabase project and run the SQL schema.

## Recommended deployment checklist
1. Add the environment variables above in Vercel.
2. Deploy the project.
3. Confirm the app loads and the login page appears.
4. If you want real data persistence, configure Supabase Auth and the SQL schema.
