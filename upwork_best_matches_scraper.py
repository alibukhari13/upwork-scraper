# upwork_best_matches_scraper.py
import setuptools
import os
import sys
import time
import re
import logging
from datetime import datetime
from supabase import create_client
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# --- SUPABASE CONFIG ---
SUPABASE_URL = "https://zpgcldllammzlxkktpfv.supabase.co"
SUPABASE_KEY = "sb_publishable_GT0CtQWcAdRGNfGGPd5GVg_zubsqSyy"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- LOGGING SETUP ---
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter('[%(levelname)s] %(asctime)s: %(message)s')
ch = logging.StreamHandler()
ch.setFormatter(formatter)
logger.addHandler(ch)

def scrape_cycle():
    driver = None
    try:
        logger.info('--- STARTING FRESH RELOAD & SCRAPE CYCLE ---')
        options = uc.ChromeOptions()
        options.add_argument('--start-maximized')
        profile_path = os.path.join(os.getcwd(), "automation_profile")
        options.add_argument(f'--user-data-dir={profile_path}')
        
        driver = uc.Chrome(options=options, version_main=144)

        if driver:
            timestamp = int(time.time())
            driver.get(f'https://www.upwork.com/nx/find-work/?t={timestamp}')
            logger.info("Page opening... Waiting 45 seconds.")
            time.sleep(45) 

            try:
                feed_tab = driver.find_element(By.XPATH, "//button[contains(., 'My Feed')]")
                driver.execute_script("arguments[0].click();", feed_tab)
                logger.info("My Feed Tab clicked.")
                
                time.sleep(1) 
                logger.info("Performing hard reload 1s before scraping...")
                driver.get(driver.current_url) 
                time.sleep(20) 
                
            except: pass

            load_count = 1
            all_cycle_jobs = [] 
            seen_urls = set()

            while load_count <= 3:
                logger.info(f"--- Scraping Batch {load_count} ---")
                for _ in range(10):
                    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.PAGE_DOWN)
                    time.sleep(1.5)

                sniffer_js = """
                function sniff() {
                    let results = [];
                    let links = document.querySelectorAll('a[href*="/jobs/"], a[href*="/details/"]');
                    links.forEach(l => {
                        let art = l.closest('article') || l.closest('section') || l.parentElement.parentElement.parentElement;
                        if (art && art.innerText.length > 100) {
                            let skillElements = art.querySelectorAll('[data-test="skill"], .air3-token, .job-tile-skills .up-skill-badge');
                            let tags = Array.from(skillElements).map(s => s.innerText.trim()).filter(s => s.length > 0).join(', ');
                            let location = art.querySelector('[data-test="client-country"], .job-tile-location')?.innerText || "Unknown";
                            let spent = art.querySelector('[data-test="client-spendings"]')?.innerText || "$0 spent";
                            let rating = art.querySelector('.air3-rating-number')?.innerText || "No rating";
                            let verified = art.querySelector('[data-test="payment-verified"]') ? "Verified" : "Unverified";
                            
                            // --- UPDATED BUDGET LOGIC ---
                            let budgetType = art.querySelector('[data-test="job-type"]')?.innerText || "";
                            let budgetAmount = art.querySelector('[data-test="budget"]')?.innerText || "";
                            let finalBudget = budgetType + (budgetAmount ? ": " + budgetAmount : "");
                            if (!finalBudget) finalBudget = "N/A";
                            // ---------------------------

                            let proposals = art.querySelector('[data-test="proposals"]')?.innerText || "N/A";
                            let timeElement = art.querySelector('[data-test="posted-on"]') || Array.from(art.querySelectorAll('span, small')).find(s => s.innerText.toLowerCase().includes('posted'));
                            
                            results.push({
                                url: l.href.split('?')[0],
                                title: l.innerText.trim() || "Web Job",
                                text: art.querySelector('[data-test="job-description-text"]')?.innerText || art.innerText,
                                location: location,
                                spent: spent,
                                rating: rating,
                                verified: verified,
                                budget: finalBudget,
                                proposals: proposals,
                                tags: tags || "Web Development",
                                exact_time: timeElement ? timeElement.innerText.replace('Posted', '').trim() : "Recently"
                            });
                        }
                    });
                    return results;
                }
                return sniff();
                """
                raw_data = driver.execute_script(sniffer_js)
                
                if raw_data:
                    for item in raw_data:
                        if item['url'] not in seen_urls:
                            all_cycle_jobs.append(item)
                            seen_urls.add(item['url'])

                if load_count < 3:
                    try:
                        more_btn = driver.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('More') || b.innerText.includes('Learn'))")
                        if more_btn:
                            driver.execute_script("arguments[0].click();", more_btn)
                            load_count += 1
                            time.sleep(12)
                        else: break
                    except: break
                else: break
                
            new_saved = 0
            for item in reversed(all_cycle_jobs):
                job_id = item['url'].split('~')[-1].strip('/')
                if any(k in (item['title'] + item['text']).lower() for k in ['web', 'dev', 'html', 'js', 'react', 'api', 'node', 'php', 'laravel', 'shopify', 'wordpress', 'figma']):
                    try:
                        exists = supabase.table('jobs').select('id').eq('job_id', job_id).execute()
                        if not exists.data:
                            logger.info(f"CLOUD SAVING: {item['title'][:40]} | {item['budget']}")
                            supabase.table('jobs').insert({
                                "job_id": job_id, "job_url": item['url'], "job_title": item['title'],
                                "posted_date": item['exact_time'], "job_description": item['text'],
                                "job_tags": item['tags'], "job_proposals": item['proposals'],
                                "client_location": item['location'], "client_spent": item['spent'],
                                "client_rating": item['rating'], "is_verified": item['verified'],
                                "budget": item['budget']
                            }).execute()
                            new_saved += 1
                    except: pass

            logger.info(f"Cycle Done. New Jobs: {new_saved}")
            driver.quit()
    except Exception as e:
        logger.error(f"Global Error: {e}")
        if driver: driver.quit()

if __name__ == '__main__':
    while True:
        scrape_cycle()
        logger.info("Waiting 25s for next fresh reload...")
        time.sleep(25)