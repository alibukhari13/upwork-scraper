# upwork_best_matches_scraper.py
import setuptools
import os
import sys
import time
import re
import logging
from datetime import datetime
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from utils.database import create_db, connect_to_db
from settings import config

# --- PROFESSIONAL LOGGING ---
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter('[%(levelname)s] %(asctime)s: %(message)s')
ch = logging.StreamHandler(sys.stdout)
ch.setFormatter(formatter)
logger.addHandler(ch)

def scrape_cycle():
    driver = None
    try:
        conn, cursor = connect_to_db()
        create_db(conn, cursor)

        logger.info('--- 2026 ULTIMATE MASTER MODE STARTING ---')
        
        options = uc.ChromeOptions()
        options.add_argument('--start-maximized')
        profile_path = os.path.join(os.getcwd(), "automation_profile")
        options.add_argument(f'--user-data-dir={profile_path}')
        
        driver = uc.Chrome(options=options, version_main=144)

        if driver:
            driver.get('https://www.upwork.com/nx/find-work/')
            logger.info("Page khul raha hai. 45 seconds wait karein...")
            time.sleep(45) 

            try:
                feed_tab = driver.find_element(By.XPATH, "//button[contains(., 'My Feed')]")
                driver.execute_script("arguments[0].click();", feed_tab)
                logger.info("Switched to My Feed Tab.")
                time.sleep(10)
            except: pass

            load_count = 1
            keep_scraping = True
            all_cycle_jobs = [] # Cycle ki saari jobs yahan jama hongi
            seen_urls_in_cycle = set()

            while keep_scraping and load_count <= 5:
                logger.info(f"--- Scraping Batch {load_count} ---")
                
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
                            results.push({
                                url: l.href.split('?')[0],
                                title: l.innerText.trim() || "Web Job",
                                text: container.innerText
                            });
                        }
                    });
                    return results;
                }
                return sniff();
                """
                raw_data = driver.execute_script(sniffer_js)
                
                if not raw_data:
                    logger.warning("Is batch mein jobs nahi milin. Waiting for render...")
                    time.sleep(10)
                    if load_count > 1: break 
                    else: continue

                # Batch ka data temporary list mein daalna
                for item in raw_data:
                    if item['url'] not in seen_urls_in_cycle:
                        all_cycle_jobs.append(item)
                        seen_urls_in_cycle.add(item['url'])

                # STOP TRIGGER: 1-Day Limit
                current_batch_text = " ".join([j['text'].lower() for j in raw_data])
                if any(x in current_batch_text for x in ["2 days ago", "3 days ago", "weeks ago"]):
                    logger.info("Limit Reached: 2+ days old jobs found. Stopping.")
                    keep_scraping = False
                    break

                # LEARN MORE / MORE JOBS AUTOMATION
                if keep_scraping and load_count < 5:
                    try:
                        more_btn_js = "return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('More') || b.innerText.includes('Learn'))"
                        more_btn = driver.execute_script(more_btn_js)
                        
                        if more_btn:
                            logger.info(f"Clicking 'Learn More' for Batch {load_count + 1}...")
                            driver.execute_script("arguments[0].scrollIntoView();", more_btn)
                            time.sleep(2)
                            driver.execute_script("arguments[0].click();", more_btn)
                            load_count += 1
                            time.sleep(12) 
                        else:
                            keep_scraping = False
                    except:
                        keep_scraping = False
                else:
                    keep_scraping = False

            # --- FINAL INSERTION: Order Matching Upwork ---
            # Reverse order mein insert karenge taake Batch 1 sab se upar aaye
            new_jobs_saved = 0
            for item in reversed(all_cycle_jobs):
                url = item['url']
                job_id = url.split('~')[-1].strip('/')
                title = item['title'].split('\n')[0].strip()
                description = item['text']

                keywords = ['web', 'dev', 'html', 'js', 'css', 'react', 'api', 'node', 'next', 'angular', 'php', 'laravel', 'figma']
                if any(k in (title + description).lower() for k in keywords):
                    cursor.execute('SELECT COUNT(*) FROM jobs WHERE job_id = ?', (job_id,))
                    if cursor.fetchone()[0] == 0:
                        logger.info(f"CAPTURING: {title[:50]}")
                        cursor.execute(
                            'INSERT INTO jobs (job_id, job_url, job_title, posted_date, job_description, job_tags, job_proposals) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            (job_id, url, title, "1 Day Ago", description[:2000], "Web Developer", "N/A")
                        )
                        conn.commit()
                        new_jobs_saved += 1

            logger.info(f"Cycle Done. Batches Scanned: {load_count}. New Jobs: {new_jobs_saved}")
            driver.quit()

    except Exception as e:
        logger.error(f"Global Error: {e}")
        if driver: driver.quit()
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    while True:
        scrape_cycle()
        logger.info("Waiting 40s for next sync...")
        time.sleep(40)