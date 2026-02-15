// upwork-dashboard/app/api/jobs/route.js
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), '../upwork_jobs.db');
        const db = new Database(dbPath);
        
        // rowid DESC: Sab se nayi scraped job sab se upar
        const jobs = db.prepare('SELECT * FROM jobs ORDER BY rowid DESC').all();
        db.close();
        
        return NextResponse.json(jobs, {
            headers: { 'Cache-Control': 'no-store' }
        });
    } catch (error) {
        return NextResponse.json([]);
    }
}