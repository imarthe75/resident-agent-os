FROM python:3.11-alpine
WORKDIR /app
RUN pip install --no-cache-dir flask requests
COPY bridge.py .
CMD ["python", "bridge.py"]
