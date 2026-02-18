#!/bin/bash

# Morning Pulse - n8n HTTPS Setup Script
# Run this script on your Google Compute Engine VM (34.122.163.50)

# 1. Ask for Domain Name
read -p "Enter your domain name (e.g., n8n.morningpulse.co.zw): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: Domain name is required."
    exit 1
fi

echo "Setting up HTTPS for $DOMAIN_NAME..."

# 2. Install Nginx and Certbot
echo "Installing Nginx and Certbot..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 3. Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN_NAME > /dev/null <<EOF
server {
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    listen 80;
}
EOF

# 4. Enable Configuration
sudo ln -s /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 5. Obtain SSL Certificate
echo "Obtaining SSL Certificate..."
sudo certbot --nginx -d $DOMAIN_NAME

echo "✅ Setup Complete! Your n8n instance should now be accessible at https://$DOMAIN_NAME"
