FROM python:3.9-slim

# Install required packages for SQL Server
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    unixodbc \
    unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure ODBC drivers
RUN echo "[ODBC Driver 18 for SQL Server]\nDriver = /opt/microsoft/msodbcsql18/lib64/libmsodbcsql-18.*.so.1.1\nUsageCount = 1\n" >> /etc/odbcinst.ini

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"] 