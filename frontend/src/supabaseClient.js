import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mcmopleftdbdhwfqzcnk.supabase.co' // TODO: Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbW9wbGVmdGRiZGh3ZnF6Y25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjMwNDksImV4cCI6MjA2NjgzOTA0OX0.Z_ik02T7ZakkCpw6VVGk1dGjeo5kITlAjYKrsRjfHmQ' // TODO: Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 