// app/api/jobs/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Vercel aur Local dono ke liye configuration
const supabase = createClient(
  process.env.SUPABASE_URL || "APNA_SUPABASE_URL_YAHA_BHI_DALEN", 
  process.env.SUPABASE_KEY || "APNA_SUPABASE_ANON_KEY_YAHA_BHI_DALEN"
)

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}