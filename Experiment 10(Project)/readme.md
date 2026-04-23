# 🚀 Online IDE

An Online IDE platform that allows users to run and manage code inside isolated, secure containers. This system provides terminal-based access to environments with the ability to preview hosted applications locally.

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Express.js (Node.js) |
| Infrastructure | Docker & Nginx |
| Authentication | Google OAuth 2.0 |
| Database | MongoDB |

---

## ⚙️ Features

- 🖥️ **Terminal-based access** — Direct interaction with isolated containers via a web terminal.
- 🔐 **Secure Auth** — Integrated Google Authentication for seamless user onboarding.
- 📦 **Containerization** — Development environments strictly isolated using Docker.
- 🌐 **Live Preview** — Host and preview applications running inside containers locally.
- 🔁 **Scalable Architecture** — Traffic and routing efficiently managed via Nginx.

---

## 🏗️ Project Architecture

```plaintext
Online IDE
│
├── frontend/             # React (Vite) client
├── backend/              # Node.js/Express API
├── setup.sh              # Environment initialization script
├── compose.yml           # Docker Compose orchestration
├── .env                  # Global environment variables
├── infra/
│   └── nginx.conf        # Nginx reverse proxy configuration
└── workspace/
    └── Dockerfile        # Base image for user containers
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Configure Environment Variables

**Backend** — Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_cloud_id
JWT_SECRET=any_secure_random_string
VOLUME_BASE_PATH=C:/ide-projects
```

**Frontend** — Create a `.env` file inside the `frontend/` folder:

```env
VITE_GOOGLE_CLIENT_ID=your_google_cloud_id
VITE_GATEWAY_URL=http://localhost
```

### 3. Execution

**Backend:**

```bash
cd backend
npm install
```

**Frontend:**

```bash
cd ../frontend
npm install
```

**Run Initialization** *(from the project root):*

```bash
chmod +x setup.sh
./setup.sh
```

---

## 💡 How It Works

1. **Authentication** — User logs in using Google Authentication.
2. **Container Management** — Backend creates and manages a dedicated Docker container for the user using the Docker Engine API.
3. **Interface** — User interacts with the container via a terminal interface in the browser.
4. **Deployment** — Applications running inside the container can be previewed locally via exposed ports managed by the Nginx reverse proxy.

---

## ⚠️ Current Limitations

- Only terminal-based interaction is currently available.
- No GUI code editor yet *(planned for future updates)*.