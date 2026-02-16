import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export async function POST(req) {
    const { email, password } = await req.json();
    const { error } = await supabase
        .from('settings')
        .update({ upwork_email: email, upwork_password: password, status: 'new_login' })
        .eq('id', 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}