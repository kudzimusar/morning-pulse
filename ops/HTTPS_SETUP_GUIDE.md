# HTTPS Setup Guide for Morning Pulse n8n Server

This guide explains how to secure your n8n instance with HTTPS using Nginx and Let's Encrypt.

## Prerequisites
- Access to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains).
- SSH access to your Google Compute Engine VM (`34.122.163.50`).

## Step 1: Configure DNS Records
1.  Log in to your domain registrar's dashboard.
2.  Navigate to the DNS settings for your domain (e.g., `morningpulse.co.zw`).
3.  Add an **A Record**:
    -   **Name/Host:** `n8n` (or whatever subdomain you prefer, e.g., `automation`)
    -   **Value/Target:** `34.122.163.50`
    -   **TTL:** Automatic or 3600 seconds
4.  Wait a few minutes for propagation. You can verify this by running `ping n8n.morningpulse.co.zw` in your terminal.

## Step 2: Run the Setup Script
1.  **Transfer the script to your VM:**
    Run this command from your local terminal (where you have the project open):
    ```bash
    scp -i /path/to/your/ssh-key ops/setup_https.sh USERNAME@34.122.163.50:~/
    ```
    *(Replace `/path/to/your/ssh-key` and `USERNAME` with your actual SSH key path and username).*

2.  **SSH into your VM:**
    ```bash
    ssh -i /path/to/your/ssh-key USERNAME@34.122.163.50
    ```

3.  **Make the script executable:**
    ```bash
    chmod +x setup_https.sh
    ```

4.  **Run the script:**
    ```bash
    sudo ./setup_https.sh
    ```

5.  **Follow the prompts:**
    -   Enter your domain name when asked (e.g., `n8n.morningpulse.co.zw`).
    -   Provide an email address for Let's Encrypt notifications if prompted.

## Step 3: Update n8n Configuration
After HTTPS is set up, you may need to update the `WEBHOOK_URL` in your n8n environment variables to use `https://`.

1.  Open your n8n configuration (usually in `docker-compose.yml` or `.env`).
2.  Set:
    ```
    WEBHOOK_URL=https://n8n.morningpulse.co.zw/
    ```
3.  Restart n8n:
    ```bash
    docker-compose restart
    # OR if running natively
    pm2 restart n8n
    ```

## Verify Setup
Visit `https://n8n.morningpulse.co.zw` in your browser. You should see the n8n login page secured with a valid SSL certificate.
