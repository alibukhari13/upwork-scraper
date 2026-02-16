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
from utils.database import create_db, connect_to_db
from settings import config

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
        # Persistent Profile taake login saved rahe aur fresh data mile
        profile_path = os.path.join(os.getcwd(), "automation_profile")
        options.add_argument(f'--user-data-dir={profile_path}')
        
        # Launching fresh browser instance
        driver = uc.Chrome(options=options, version_main=144)

        if driver:
            # 1. Open URL with Cache Buster (Forcing server to send new data)
            timestamp = int(time.time())
            fresh_url = f'https://www.upwork.com/nx/find-work/?t={timestamp}'
            driver.get(fresh_url)
            logger.info(f"Page opening with cache buster... Waiting 45 seconds.")
            time.sleep(45) 

            # 2. Ensure "My Feed" Tab is selected and Hard Refresh
            try:
                feed_tab = driver.find_element(By.XPATH, "//button[contains(., 'My Feed')]")
                driver.execute_script("arguments[0].click();", feed_tab)
                logger.info("My Feed Tab clicked.")
                
                # --- REFRESH LOGIC START ---
                time.sleep(1) # Wait exactly 1 second after tab click as requested
                logger.info("Performing hard reload to bypass React cache...")
                
                # Hard reload by re-navigating to current URL to ensure fresh API calls
                driver.get(driver.current_url) 
                time.sleep(20) # Wait for fresh jobs to render after hard reload
                # --- REFRESH LOGIC END ---
                
            except Exception as e:
                logger.warning(f"Tab/Refresh issue: {e}")

            load_count = 1
            keep_scraping = True
            all_cycle_jobs = [] 
            seen_urls_in_cycle = set()

            # --- BATCH BY BATCH LOGIC (3 Batches) ---
            while keep_scraping and load_count <= 3:
                logger.info(f"--- Scraping Batch {load_count} ---")
                
                # Scrolling to trigger rendering of new items
                for _ in range(10):
                    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.PAGE_DOWN)
                    time.sleep(1.5)

                sniffer_js = """
                function sniff() {
                    let results = [];
                    let links = document.querySelectorAll('a[href*="/jobs/"], a[href*="/details/"]');
                    links.forEach(l => {
                        let container = l.closest('article') || l.closest('section') || l.parentElement.parentElement.parentElement;
                        if (container && container.innerText.length > 100) {
                            let timeText = "N/A";
                            let timeElement = container.querySelector('span[data-test="posted-on"]') || 
                                              Array.from(container.querySelectorAll('span, small')).find(s => s.innerText.toLowerCase().includes('posted'));
                            if (timeElement) {
                                timeText = timeElement.innerText.replace('Posted', '').trim();
                            }

                            results.push({
                                url: l.href.split('?')[0],
                                title: l.innerText.trim() || "Web Job",
                                text: container.innerText,
                                exact_time: timeText
                            });
                        }
                    });
                    return results;
                }
                return sniff();
                """
                raw_data = driver.execute_script(sniffer_js)
                
                if not raw_data:
                    logger.warning("Jobs load nahi huin. Batch skipping...")
                    time.sleep(10)
                    break

                for item in raw_data:
                    if item['url'] not in seen_urls_in_cycle:
                        all_cycle_jobs.append(item)
                        seen_urls_in_cycle.add(item['url'])

                # STOP TRIGGER: 1-Day Limit
                current_batch_text = " ".join([j['text'].lower() for j in raw_data])
                if any(x in current_batch_text for x in ["2 days ago", "3 days ago", "weeks ago"]):
                    logger.info("Old jobs reached. Stopping batches.")
                    keep_scraping = False
                    break

                # LEARN MORE AUTOMATION
                if keep_scraping and load_count < 3:
                    try:
                        more_btn_js = "return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('More') || b.innerText.includes('Learn'))"
                        more_btn = driver.execute_script(more_btn_js)
                        if more_btn:
                            logger.info(f"Loading Batch {load_count + 1}...")
                            driver.execute_script("arguments[0].scrollIntoView();", more_btn)
                            time.sleep(2)
                            driver.execute_script("arguments[0].click();", more_btn)
                            load_count += 1
                            time.sleep(12) 
                        else: keep_scraping = False
                    except: keep_scraping = False
                else: keep_scraping = False

            # --- SUPABASE CLOUD INSERTION (Newest First Logic) ---
            new_jobs_saved = 0
            for item in reversed(all_cycle_jobs):
                url = item['url']
                job_id = url.split('~')[-1].strip('/')
                title = item['title'].split('\n')[0].strip()
                description = item['text']
                posted_on = item.get('exact_time', 'Recently')

                keywords = ['web', 'dev', 'html', 'js', 'css', 'react', 'api', 'node', 'next', 'angular', 'php', 'laravel', 'figma']
                if any(k in (title + description).lower() for k in keywords):
                    
                    # Duplicate Check
                    exists = supabase.table('jobs').select('id').eq('job_id', job_id).execute()
                    
                    if not exists.data:
                        logger.info(f"SAVING TO CLOUD: {title[:50]} | {posted_on}")
                        data = {
                            "job_id": job_id,
                            "job_url": url,
                            "job_title": title,
                            "posted_date": posted_on,
                            "job_description": description[:1500],
                            "job_tags": "Web Developer",
                            "job_proposals": "Less than 5"
                        }
                        supabase.table('jobs').insert(data).execute()
                        new_jobs_saved += 1

            logger.info(f"Cycle Finished. Batches: {load_count}. New Jobs: {new_jobs_saved}")
            driver.quit() 

    except Exception as e:
        logger.error(f"Global Error: {e}")
        if driver: driver.quit()

if __name__ == '__main__':
    while True:
        scrape_cycle()
        # 15 SECONDS WAIT BEFORE NEXT FRESH RELOAD
        logger.info("Waiting 15s for next fresh reload...")
        time.sleep(15)