// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Initialize Supabase client
const SUPABASE_URL = 'https://haaxbgibiagiamsnczeu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYXhiZ2liaWFnaWFtc25jemV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjczODgsImV4cCI6MjA2NDIwMzM4OH0.hcZ0eTCh9SDZQjK-cLCEXLHthV9t9KVccvhRDHCdxT4'

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Make supabase client available globally
window.supabase = supabase

// Test the connection
supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
        console.error('Supabase connection error:', error)
    } else {
        console.log('Supabase connected successfully')
    }
}).catch(err => {
    console.error('Error testing Supabase connection:', err)
}) 