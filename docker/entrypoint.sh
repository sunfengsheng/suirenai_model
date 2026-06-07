#!/bin/sh
set -e

CONF="/etc/nginx/conf.d/default.conf"
BASE_URL="${API_BASE_URL:-https://api.suirenai.com}"
PROXY_HOST=$(echo "$BASE_URL" | sed 's|.*://||' | cut -d'/' -f1)

cat > "$CONF" <<EOF
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
EOF

i=0
while true; do
    eval "KEY=\${PROXY_KEY_$i}"
    [ -z "$KEY" ] && break
    cat >> "$CONF" <<EOF

    location /proxy/ch${i}/ {
        proxy_pass ${BASE_URL}/;
        proxy_set_header Authorization "Bearer ${KEY}";
        proxy_set_header Host ${PROXY_HOST};
        proxy_ssl_server_name on;
    }
EOF
    i=$((i + 1))
done

echo "}" >> "$CONF"

echo "Nginx configured: ${i} channel(s), target: ${BASE_URL}"
nginx -t
exec nginx -g "daemon off;"
