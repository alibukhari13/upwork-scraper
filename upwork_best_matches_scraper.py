# upwork_best_matches_scraper.py
import setuptools
import os
import time
import re
import logging
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

# Logging Setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter('[%(levelname)s] %(asctime)s: %(message)s')
ch = logging.StreamHandler()
ch.setFormatter(formatter)
logger.addHandler(ch)

def scrape_cycle():
    driver = None
    try:
        options = uc.ChromeOptions()
        options.add_argument('--start-maximized')
        profile_path = os.path.join(os.getcwd(), "automation_profile")
        options.add_argument(f'--user-data-dir={profile_path}')
        
        driver = uc.Chrome(options=options, version_main=144)

        if driver:
            driver.get('https://www.upwork.com/nx/find-work/')
            logger.info("Page opening... Waiting 30s")
            time.sleep(30) 

            # My Feed Tab
            try:
                feed_tab = driver.find_element(By.XPATH, "//button[contains(., 'My Feed')]")
                driver.execute_script("arguments[0].click();", feed_tab)
                time.sleep(10)
            except: pass

            # Scraping logic
            sniffer_js = "return Array.from(document.links).filter(l => l.href.includes('/jobs/~')).map(l => ({url: l.href.split('?')[0], title: l.innerText.trim(), text: l.closest('article')?.innerText || ''}))"
            raw_data = driver.execute_script(sniffer_js)
            
            if raw_data:
                for item in reversed(raw_data):
                    job_id = item['url'].split('~')[-1].strip('/')
                    
                    # Supabase check if exists
                    exists = supabase.table('jobs').select('id').eq('job_id', job_id).execute()
                    
                    if not exists.data:
                        data = {
                            "job_id": job_id,
                            "job_url": item['url'],
                            "job_title": item['title'] or "Web Job",
                            "posted_date": "Just Scraped",
                            "job_description": item['text'][:2000],
                            "job_tags": "Web Dev",
                            "job_proposals": "0"
                        }
                        supabase.table('jobs').insert(data).execute()
                        logger.info(f"CLOUD SAVED: {item['title'][:50]}")

            driver.quit()
    except Exception as e:
        logger.error(f"Error: {e}")
        if driver: driver.quit()

if __name__ == '__main__':
    while True:
        scrape_cycle()
        logger.info("Cycle finished. Next in 60s...")
        time.sleep(60)