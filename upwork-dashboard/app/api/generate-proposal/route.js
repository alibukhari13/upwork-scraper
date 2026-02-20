import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL || "https://zpgcldllammzlxkktpfv.supabase.co", 
  process.env.SUPABASE_KEY || "sb_publishable_GT0CtQWcAdRGNfGGPd5GVg_zubsqSyy"
);

export async function POST(req) {
    try {
        const job = await req.json();

        // 1. History se User ka style uthana
        const { data: history } = await supabase
            .from('proposals')
            .select('proposal_text')
            .order('updated_at', { ascending: false })
            .limit(3);

        let styleContext = "";
        if (history && history.length > 0) {
            styleContext = "User's preferred writing style (Follow this tone):\n" + 
                           history.map(h => h.proposal_text).join("\n---\n");
        }

        // 2. Skill-Focused Prompt (Rating Removed)
        const prompt = `
        You are a top-rated Upwork Freelancer. Write a high-converting, personalized proposal.
        
        CRITICAL TASK:
        Highlight the required skills: ${job.job_tags}. 
        Explain briefly how your expertise in these specific technologies makes you the perfect fit.

        JOB DETAILS:
        - Title: ${job.job_title}
        - Description: ${job.job_description}
        - Budget/Rate: ${job.budget}
        - Experience Level: ${job.experience_level}
        - Project Duration: ${job.project_duration}

        CLIENT CONTEXT:
        - Location: ${job.client_location}
        - Total Spent: ${job.client_spent}
        - Payment Status: ${job.is_verified}

        ${styleContext}

        INSTRUCTIONS:
        - Start with a strong hook related to the job.
        - Focus on the technical skills mentioned (${job.job_tags}).
        - Keep it professional, concise, and avoid generic templates.
        - End with a call to action (e.g., inviting them to a chat).
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a professional Upwork proposal expert who focuses on technical skills." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        return NextResponse.json({ proposal: response.choices[0].message.content });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}