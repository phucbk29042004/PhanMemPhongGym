FROM node:20-alpine

# Cài thư viện cần thiết để build better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json trước để tận dụng Docker cache
COPY package*.json ./

# Cài dependencies
RUN npm install --production

# Copy toàn bộ source code BE
COPY . .

# Tạo thư mục chứa SQLite database
RUN mkdir -p /data

EXPOSE 3000

CMD ["sh", "-c", "node init-db.js && node index.js"]