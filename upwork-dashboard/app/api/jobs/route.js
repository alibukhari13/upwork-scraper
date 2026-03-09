import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL || "https://zpgcldllammzlxkktpfv.supabase.co", 
  process.env.SUPABASE_KEY || "sb_publishable_GT0CtQWcAdRGNfGGPd5GVg_zubsqSyy"
)

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Settings fetch karein
        const { data: settings } = await supabase.from('settings').select('expiry_minutes').eq('id', 1).single();
        
        // 2. SAFETY CHECK: Agar setting nahi mili ya 0 hai, to delete mat karo
        if (settings && settings.expiry_minutes > 0) {
            const expiryMins = settings.expiry_minutes;
            
            // UTC based calculation (Server side)
            // Hum 1 minute ka extra buffer de rahe hain sync issues ke liye
            const cutoffTime = new Date(Date.now() - (expiryMins * 60 * 1000)).toISOString();
            
            await supabase
                .from('jobs')
                .delete()
                .lt('created_at', cutoffTime);
        }

        // 3. Fetch Jobs
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error; 
        
        return NextResponse.json(jobs, { 
            headers: { 
                'Cache-Control': 'no-store, max-age=0, must-revalidate' 
            } 
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await supabase.from('jobs').delete().eq('job_id', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}