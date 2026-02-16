FROM python:3.11-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget gnupg unzip curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && apt-get clean

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

# Render par port zaroori hoti hai (chahe use na ho)
EXPOSE 10000

CMD ["python", "upwork_best_matches_scraper.py"]