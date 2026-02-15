import sqlite3

def check_all_jobs():
    try:
        conn = sqlite3.connect('upwork_jobs.db')
        cursor = conn.cursor()
        
        # Check table exist karti hai ya nahi
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='jobs'")
        if not cursor.fetchone():
            print("Error: 'jobs' table abhi tak nahi bani!")
            return

        cursor.execute("SELECT job_title, job_url FROM jobs")
        rows = cursor.fetchall()
        
        if not rows:
            print("Database khali hai (0 rows).")
        else:
            print(f"\n--- Database mein total {len(rows)} Jobs mili hain ---\n")
            for i, row in enumerate(rows, 1):
                print(f"{i}. TITLE: {row[0]}")
                print(f"   URL:   {row[1]}")
                print("-" * 30)
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_all_jobs()