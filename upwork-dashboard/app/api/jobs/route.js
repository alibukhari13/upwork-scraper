// app/api/jobs/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Vercel aur Local dono ke liye configuration
const supabase = createClient(
  process.env.SUPABASE_URL || "https://zpgcldllammzlxkktpfv.supabase.co", 
  process.env.SUPABASE_KEY || "sb_publishable_GT0CtQWcAdRGNfGGPd5GVg_zubsqSyy"
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