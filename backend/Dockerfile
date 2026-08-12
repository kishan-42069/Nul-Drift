# Use the official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# (Often needed for compiling some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download the required spaCy model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the backend code
COPY . .

# Expose the port (Render will dynamically set the PORT environment variable)
EXPOSE 8000

# Run the FastAPI app with uvicorn
# Note: Render often sets a $PORT environment variable, so we can use it or fallback to 8000
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
