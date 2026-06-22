FROM nginx:alpine

# Xóa config mặc định
RUN rm -rf /usr/share/nginx/html/*

# Copy toàn bộ FE vào Nginx
COPY . /usr/share/nginx/html

# Copy config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80