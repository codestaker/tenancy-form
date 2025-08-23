# 🚀 From Code to Cloud: A Complete Guide to Deploying Your Node.js App on Google Cloud 🚀

## Part 1: Introduction & Foundations

🎯 **Goal:** This guide is your complete "class manual" for deploying a containerized Node.js web application on a Google Cloud Platform (GCP) Virtual Machine (VM). We will cover everything from initial server setup and application deployment to securing your site with a custom domain and a free SSL certificate. By the end, you will have a live, secure, and scalable web application.

🛠️ **Core Technologies:**
*   **Backend:** Node.js with Express - A fast and minimalist web framework for Node.js.
*   **Containerization:** Docker - A platform to build, ship, and run applications in isolated environments called containers.
*   **Web Server / Reverse Proxy:** Nginx - A high-performance web server we will use to manage traffic to our application.
*   **Cloud Provider:** Google Cloud Platform (GCP) - Our choice for hosting the application on a virtual server.
*   **SSL:** Let's Encrypt (via Certbot) - A free, automated, and open certificate authority to provide HTTPS.

✅ **Prerequisites:**
*   A Google Cloud account with billing enabled (we will use the free tier to avoid costs).
*   A registered domain name from any domain provider (e.g., GoDaddy, Namecheap, Google Domains).
*   Your application code pushed to a GitHub repository.
*   `gcloud` CLI installed on your local machine (optional, but highly recommended for easier management).

---

## Part 2: Preparing Your Application for Deployment

🔍 **Code Review & Key Fixes:** Before deploying, we made several crucial changes to ensure the application was ready for a production environment.
*   **`server.js`:** We configured the Express server to listen on `0.0.0.0` instead of `localhost`. This is vital because it allows the server to accept connections from outside its Docker container, making it accessible to Nginx and the internet.
*   **`homepage.html`:** We added the `<meta name="viewport" content="width=device-width, initial-scale=1.0">` tag. This ensures the website is responsive and displays correctly on all devices, especially mobile phones.
*   **Open Graph Tags:** We added `og:` meta tags to `index.html`. This allows social media platforms like WhatsApp, X (Twitter), and Facebook to generate a rich link preview (with a title, description, and image) when your URL is shared.

📦 **The Dockerfile Explained:** A `Dockerfile` is a recipe for creating a Docker image. Our application lives inside this image.

```dockerfile
# Use an official, lightweight Node.js runtime as a base
FROM node:18-slim

# Set the working directory inside the container where our code will live
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's layer caching
COPY package*.json ./

# Install all the project dependencies defined in package.json
RUN npm install

# Bundle the rest of the app's source code into the image
COPY . .

# The app runs on port 5001 inside the container, so we "expose" it
EXPOSE 5001

# The command that will be executed when the container starts
CMD [ "node", "server.js" ]
```

---

## Part 3: Building Your Cloud Infrastructure on GCP

☁️ **Step 1: Launching a Free Google Cloud VM**
*   **Why are we doing this?** A Virtual Machine (VM) is our own private server in the cloud. It's where we will install our software and run our application. We're using the free tier to host it without cost.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  In the top-left navigation menu (☰), go to **Compute Engine** > **VM instances**.
3.  Click **CREATE INSTANCE**.
4.  **Name:** Give your VM a memorable name (e.g., `tenancy-app-vm`).
5.  **Region & Zone:** To qualify for the free tier, select one of the following US regions: `us-west1` (Oregon), `us-central1` (Iowa), or `us-east1` (South Carolina).
6.  **Machine Configuration:** In the **Series** dropdown, select **E2**. In the **Machine type** dropdown, select **e2-micro**. This is the specific configuration that is part of the free tier.
7.  **Boot Disk:** Ensure the **Operating System** is **Ubuntu** and the **Version** is **Ubuntu 22.04 LTS**.
8.  **Firewall:** This is critical! Check the boxes for both **Allow HTTP traffic** and **Allow HTTPS traffic**. This opens the standard web ports (80 and 443) so people can visit your site.
9.  Click **Create**.

📍 **Step 2: Reserving a Static IP Address**
*   **Why are we doing this?** By default, a VM's public IP address is "ephemeral," meaning it can change if you stop and restart the VM. If our domain points to an old IP, our website will break. By reserving a static (permanent) IP, we ensure our domain always points to the right server.

1.  In the navigation menu (☰), scroll to the **NETWORKING** section. Click **VPC network** > **IP addresses**.
2.  You will see your VM's name and its IP address. In the "Type" column, it will say "Ephemeral".
3.  Click **RESERVE** (or on the three-dot menu to the right and select "Promote to static IP address").
4.  Give the static IP a name (e.g., `tenancy-app-ip`) and click **Reserve**.
5.  **Copy this new static IP address!** You will need it in the next step.

🌐 **Step 3: Pointing Your Domain to Your VM**
*   **Why are we doing this?** This step connects your human-readable domain name (e.g., `yourdomain.com`) to your server's machine-readable IP address.

1.  Log in to your domain provider's website (GoDaddy, Namecheap, etc.).
2.  Find the DNS Management page for your domain.
3.  You need to create or edit an **'A' Record**.
    *   **Type:** `A`
    *   **Host/Name:** `@` (This symbol represents your root domain).
    *   **Value/Points to:** Paste the **Static IP Address** you copied from Google Cloud.
    *   **TTL (Time to Live):** You can leave this at the default setting.
4.  Save your changes. Note: DNS changes can take some time to update across the internet, from a few minutes to a few hours.

---

## Part 4: The Deployment - Bringing Your App to Life

💻 **Step 4: Connecting to Your VM with SSH**
In the Google Cloud Console (**Compute Engine > VM instances**), find your VM in the list and click the **SSH** button on the right. This will open a secure command-line terminal to your server directly in your browser.

🔧 **Step 5: Installing the Essentials (Git, Docker, Nginx)**
In the SSH terminal, run the following commands one by one.

```bash
# First, update your server's list of available software packages
sudo apt-get update

# Install Git, which we'll use to clone your code from GitHub
sudo apt-get install -y git

# Install Docker, the containerization platform
sudo apt-get install -y docker.io

# Start the Docker service and enable it to automatically start when the server reboots
sudo systemctl start docker
sudo systemctl enable docker

# Install Nginx, our web server and reverse proxy
sudo apt-get install -y nginx
```

📂 **Step 6: Cloning Your Project from GitHub**
Use Git to download your application code onto the server.

```bash
# Replace the URL with your own GitHub repository URL
git clone https://github.com/codestaker/tenancy-form.git
```

🐳 **Step 7: Building & Running the Docker Container**
1.  Navigate into the project directory you just cloned:
    ```bash
    cd tenancy-form
    ```
2.  Build the Docker image from your `Dockerfile`:
    ```bash
    # This command reads the Dockerfile and builds a runnable image named "tenancy-app"
    sudo docker build -t tenancy-app .
    ```
3.  Run your application inside a Docker container:
    ```bash
    # This command starts your application in the background
    sudo docker run \
      -d \
      -p 5001:5001 \
      --name tenancy-app-container \
      --restart always \
      tenancy-app
    ```
    *   `sudo docker run`: The command to run a container.
    *   `-d`: Run in "detached" mode (in the background).
    *   `-p 5001:5001`: "Publish" a port. This maps port 5001 of the VM to port 5001 inside the container, allowing communication.
    *   `--name tenancy-app-container`: Give the container a memorable name.
    *   `--restart always`: A crucial command that tells Docker to automatically restart the container if it ever crashes or the server reboots.
    *   `tenancy-app`: The name of the image we are running.

---

## Part 5: Securing Your Website with Nginx & SSL

🛡️ **Step 8: Configuring Nginx as a Reverse Proxy**
*   **Why are we doing this?** Nginx will act as the "front door" to our application. It listens for all public web traffic (on ports 80 and 443) and forwards it to our Node.js app, which is running privately on port 5001. This is a standard and secure way to run web applications.

1.  Open the default Nginx configuration file using the `nano` text editor:
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```
2.  Delete all the existing text in the file and replace it with the configuration below. **Remember to replace `yourdomain.com` with your domain.**

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location / {
            proxy_pass http://localhost:5001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
3.  Save and exit: Press `Ctrl+X`, then `Y`, then `Enter`.
4.  Test your Nginx configuration to make sure there are no typos:
    ```bash
    sudo nginx -t
    ```
5.  Restart Nginx to apply the new configuration:
    ```bash
    sudo systemctl restart nginx
    ```

🔒 **Step 9: Installing a Free SSL Certificate with Certbot**
*   **Why are we doing this?** An SSL certificate enables HTTPS (the 'S' stands for secure), which encrypts traffic between your users and your server. It's essential for security, user trust, and even SEO. Certbot is a tool that automates getting and renewing free SSL certificates from Let's Encrypt.

1.  Install Certbot and its Nginx plugin:
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    ```
2.  Run Certbot. It will automatically detect your domain from your Nginx configuration, get a certificate, and update the Nginx config for you.
    ```bash
    # Replace the domain and email with your own
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --email your-email@example.com --agree-tos --no-eff-email -n
    ```
    *   `--nginx`: Tells Certbot to use the Nginx plugin.
    *   `-d`: Specifies the domains to include in the certificate.
    *   `--email`, `--agree-tos`, `--no-eff-email`, `-n`: These flags automate the process by agreeing to the terms of service and providing an email for renewal notices.

Certbot will handle everything. Your site is now live, secure, and accessible via `https://yourdomain.com`.

---

## Part 6: Troubleshooting - Solving Common Problems

⚠️ **The "Common Pitfalls" Manual**

*   **Problem:** I can't access my website at my domain.
    *   **Solution 1 (DNS):** DNS changes can take time. Use a tool like [whatsmydns.net](https://whatsmydns.net) to check if your domain is pointing to your VM's IP address across the globe.
    *   **Solution 2 (Firewall):** In the Google Cloud Console, double-check your VM's firewall rules. Ensure that "HTTP traffic" and "HTTPS traffic" are allowed.
    *   **Solution 3 (Nginx):** Check the Nginx service status with `sudo systemctl status nginx`. If it's not running, check your configuration for typos with `sudo nginx -t`.

*   **Problem:** I see a "502 Bad Gateway" error.
    *   **Why this happens:** This error means Nginx is working but it can't communicate with your Node.js application.
    *   **Solution:** Check that your Docker container is actually running with `sudo docker ps`. If you don't see `tenancy-app-container` in the list, check its logs for errors: `sudo docker logs tenancy-app-container`.

*   **Problem:** The link preview image doesn't show up on social media.
    *   **Why this happens:** Social media platforms cache information about links. After you add `og:` tags, you need to tell them to look again.
    *   **Solution:** Use the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/). Paste your URL and click "Scrape Again". This forces Facebook (and WhatsApp/Messenger) to fetch a fresh copy of your link preview. Other platforms like Twitter have similar "Card Validator" tools.

*   **Problem:** The `certbot` command fails.
    *   **Why this happens:** Certbot needs to verify you own the domain by accessing a special file on your server. If your DNS isn't pointing correctly yet, this will fail.
    *   **Solution:** Be patient and wait for your DNS changes to fully propagate. Use `whatsmydns.net` to confirm before running the Certbot command again.

*   **Problem:** When I try to run my container, I get an error like "port is already allocated" or "address already in use".
    *   **Why this happens:** This means another process (usually an old or duplicate container) is already using the port you need (e.g., 5001).
    *   **Solution:** Find and stop the conflicting process.
        ```bash
        # List all running processes and find the one using your port
        sudo lsof -i :5001

        # The output will give you a PID (Process ID). Use the kill command to stop it.
        # Replace PID with the actual number you see.
        sudo kill -9 PID
        ```
    *   If the conflict is from another Docker container, you can find and stop it by name:
        ```bash
        # List all containers (including stopped ones) to find the name
        sudo docker ps -a
        # Stop the container
        sudo docker stop name-of-old-container
        ```

---

## Part 7: 🔄 Keeping Your Application Updated

Perfect 👌🏽 Let’s keep it simple and direct. Now that you're deployed, you'll need a process for pushing new changes from GitHub to your live server.

Here’s the exact flow you’ll follow 👇🏽

*   **Step 1: Push Your Latest Code to GitHub**
    *   On your local machine, commit and push your changes as you normally would.
        ```bash
        git add .
        git commit -m "feat: Add new feature"
        git push
        ```

*   **Step 2: Connect to Your VM (SSH into your instance)**
    *   Connect to your Google Cloud VM through the console or your local terminal.

*   **Step 3: Pull the Latest Changes from GitHub**
    *   Navigate to your project directory and pull the new code from your GitHub repository.
        ```bash
        cd tenancy-form
        git pull origin main # Or your default branch name
        ```

*   **Step 4: Rebuild and Relaunch Your Docker Container**
    *   We need to build a new image with the updated code and then replace the old running container with a new one.
        ```bash
        # Rebuild the Docker image with the new code
        sudo docker build -t tenancy-app .

        # Stop the currently running container
        sudo docker stop tenancy-app-container

        # Remove the old container
        sudo docker rm tenancy-app-container

        # Run a new container with the updated image
        sudo docker run -d -p 5001:5001 --name tenancy-app-container --restart always tenancy-app
        ```

Your site is now updated with the latest changes!
