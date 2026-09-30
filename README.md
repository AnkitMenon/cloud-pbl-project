# CloudVault — Cloud-Based File Management System

A small cloud storage web app built for the Cloud Computing PBL. Users register, log in, upload files to a server, manage them from a dashboard, and share any file through a public link that works without logging in.

---

## 1. Problem statement

Files kept on one laptop or pen drive are tied to that device. They are hard to reach from anywhere else, easy to lose, and awkward to share. Emailing attachments creates copies everywhere and has size limits. Students and small teams need one place where files live on a server, can be reached from any browser, and can be shared with a link.

## 2. Proposed solution

CloudVault stores files on a central server behind a REST API. A React web client talks to that API over HTTP, so the same files are available from any device with a browser. Every user has a private space protected by JWT authentication, and any file can be given an unguessable share link for people without an account.

The app runs entirely on your machine for free, but it is built the way a cloud app is built: a separate frontend and backend, stateless token auth, a database for metadata, and a storage layer that can be swapped for cloud object storage such as AWS S3 without changing the API.

## 3. Features

- Register and log in (passwords hashed with bcrypt, sessions via JWT)
- Upload files by drag-and-drop or file picker, with a live progress bar
- Dashboard with total files, storage used and number of shared links
- Search files by name
- Download, share and delete each file
- Share links: copy the link, open it, or turn it off at any time
- Public share page where anyone with the link can download without an account
- Confirmation before delete, toast notifications, loading and empty states
- Responsive layout for desktop and mobile
- Validation: 10 MB size limit, allowed file types only, empty files rejected, path-traversal-safe filenames, unique stored names
- Users can only see, download or delete their own files

## 4. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, React Router, Axios, Lucide icons |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLite through SQLAlchemy 2 |
| Authentication | JWT (PyJWT), bcrypt password hashing |
| File storage | Local `uploads/` folder behind a swappable storage class |

Everything is free and open source. No paid APIs, no cloud account and no credit card are needed.

## 5. Architecture

```
          User (any browser, any device)
                       │
                       ▼
        React frontend  (Vite dev server :5173)
                       │   HTTP + JSON, Authorization: Bearer <JWT>
                       ▼
        FastAPI REST API  (Uvicorn :8000)
                       │
                       ▼
        Authentication layer  (JWT check, bcrypt passwords)
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   SQLite database             File storage
   (users, file metadata)      (backend/uploads/)
```

**How a request flows (upload example)**

1. The user drops a file in the upload dialog.
2. React sends `POST /files/upload` as `multipart/form-data`, with the JWT in the `Authorization` header.
3. FastAPI verifies the JWT and finds the user.
4. The backend cleans the filename, checks the extension and streams the bytes to storage under a random UUID name, stopping if it passes 10 MB.
5. A row is written to the `files` table with the owner, original name, size, type and date.
6. The API returns the file's metadata as JSON and the dashboard updates.

**Backend structure**

```
backend/
├── main.py          App setup, CORS, error handlers, router registration
├── config.py        Settings (secret key, size limit, allowed types), all overridable by env vars
├── database.py      SQLAlchemy engine and session
├── models.py        User and File tables
├── schemas.py       Request/response models and validation
├── auth.py          bcrypt hashing, JWT creation and the get_current_user dependency
├── storage.py       Storage layer (LocalStorage today, S3-ready interface)
├── seed.py          Optional demo user
└── routes/
    ├── auth.py      /auth/register, /auth/login, /auth/me
    └── files.py     /files/*, /share/*
```

### Moving to a real cloud deployment

The current version runs locally. Each part maps directly to a cloud service:

| Now (local) | In the cloud | What changes |
|---|---|---|
| React on Vite dev server | **Vercel** or Netlify (static hosting + CDN) | Run `npm run build`, deploy `dist/`, set `VITE_API_URL` to the backend URL |
| FastAPI on Uvicorn | **Render**, Railway or PythonAnywhere | Same code; set `CLOUDVAULT_SECRET_KEY` and `CLOUDVAULT_FRONTEND_ORIGINS` env vars |
| SQLite file | **PostgreSQL** (Render, Supabase, Neon) | Set `CLOUDVAULT_DATABASE_URL`; SQLAlchemy handles the rest |
| `uploads/` folder | **AWS S3**, Cloudflare R2 or Supabase Storage | Add an `S3Storage` class with the same `save/open/exists/delete` methods in `storage.py` |

None of these are required for this project. They show that the design is deployment-ready.

## 6. Database design

**users**

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| username | String(50) | Display name |
| email | String(255) | Unique, stored lowercase |
| hashed_password | String(255) | bcrypt hash, never the plain password |
| created_at | DateTime | UTC |

**files**

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| user_id | Integer | Foreign key → users.id |
| original_filename | String(255) | Cleaned name shown to the user |
| stored_filename | String(255) | Unique UUID name on disk, e.g. `3c26c6bd…ab1.pdf` |
| file_size | Integer | Bytes |
| file_type | String(100) | MIME type, e.g. `application/pdf` |
| upload_date | DateTime | UTC |
| share_token | String(64) | Null until shared; random 22-character token |

Relationship: one user has many files. Deleting a user deletes their file records.

## 7. API endpoints

Interactive API docs are generated automatically at **http://localhost:8000/docs**.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create an account, returns a JWT |
| POST | `/auth/login` | No | Log in, returns a JWT |
| GET | `/auth/me` | Yes | Current user |
| POST | `/files/upload` | Yes | Upload one file (`multipart/form-data`, field `file`) |
| GET | `/files` | Yes | List your files with total count and size |
| GET | `/files/{id}/download` | Yes | Download one of your files |
| DELETE | `/files/{id}` | Yes | Delete one of your files |
| POST | `/files/{id}/share` | Yes | Create (or return the existing) share token |
| DELETE | `/files/{id}/share` | Yes | Turn off the share link |
| GET | `/share/{token}` | No | Public download through a share link |
| GET | `/share/{token}/info` | No | Public file details for the share page |

**Error responses** (all return `{"detail": "message"}`):

| Situation | Status |
|---|---|
| Wrong email or password | 401 |
| Missing, invalid or expired token | 401 |
| Email already registered | 409 |
| Invalid email / short password / no file chosen | 422 |
| Empty file or bad filename | 400 |
| File type not allowed (e.g. `.exe`) | 415 |
| File over 10 MB | 413 |
| File not found, or belongs to another user | 404 |
| Share link invalid or turned off | 404 |
| Record exists but data missing from storage | 410 |
| Unexpected server error | 500 |

Another user's file returns 404, not 403, so file IDs can't be probed to learn whether they exist.

## 8. Installation

**Requirements:** Python 3.10+ and Node.js 18+.

```bash
git clone <your-repo-url> cloudvault
cd cloudvault
```

### Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python seed.py          # optional: creates the demo account
```

### Frontend setup

```bash
cd frontend
npm install
```

## 9. How to run the backend

From `backend/` with the virtual environment active:

```bash
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- API docs (Swagger UI): http://localhost:8000/docs

The database file `cloudvault.db` and the `uploads/` folder are created automatically on first run.

## 10. How to run the frontend

In a second terminal, from `frontend/`:

```bash
npm run dev
```

Open **http://localhost:5173**.

Keep both terminals running while you use the app.

**Demo account** (after running `python seed.py`): `demo@cloudvault.com` / `demo123`

## 11. Demo steps

Keep 2–3 small files ready (for example a PDF, an image and a text file) and one `.exe` or other blocked file to show validation.

1. **Register.** Open http://localhost:5173, click *Create an account*. Enter a username, email and password. Try mismatched passwords first to show validation, then fix it. You land on an empty dashboard.
2. **Log out and log in.** Log out, then try a wrong password to show the error message. Log in correctly.
3. **Upload files.** Click *Upload file*, drag in a file and click *Upload*, watching the progress bar. Repeat for 2–3 files. Optionally try the blocked file to show "File type not supported".
4. **Show the dashboard.** Point out total files, storage used, file type icons, and search by typing part of a name.
5. **Download a file.** Click the download icon on a row.
6. **Delete a file.** Click the bin icon, show the confirmation dialog, confirm. The counts update.
7. **Generate a share link.** Click the share icon on a file. A link like `http://localhost:5173/share/abc123…` appears. Click *Copy*.
8. **Open the share link.** Paste it in a private/incognito window, where you're not logged in. The share page shows the file and who shared it; click *Download file*. Then click *Turn off link* in the dashboard and reload the private window to show "Link not available".
9. **Explain the architecture.** Use the left panel of the login page, which shows the request path, plus section 5 of this README. Open http://localhost:8000/docs to show the REST API live, and open `backend/uploads/` to show files stored under random UUID names.

## 12. Cloud computing concepts demonstrated

**Client-server architecture.** The React client only handles display. All data and rules live on the server. Any number of clients can use the same server.

**REST APIs.** The frontend and backend communicate only through HTTP endpoints that exchange JSON. Resources (`/files`, `/files/{id}`) are acted on with standard methods (GET, POST, DELETE). Because the API is the only contract, the same backend could serve a mobile app or a CLI.

**Remote access.** Files live on the server, not the user's device. Logging in from any browser shows the same files.

**Authentication.** Passwords are hashed with bcrypt, so even the database owner can't read them. After login the server issues a signed JWT that expires in 24 hours. The token is sent with every request, and the server checks the signature. No session is stored on the server, which is what lets a cloud backend run many copies behind a load balancer.

**Data storage.** Structured metadata (who owns what, sizes, dates) goes in a relational database. The file bytes themselves go in a separate storage layer. This is the same split real cloud systems use: a database like PostgreSQL for metadata, and object storage like S3 for blobs.

**Why cloud storage is useful.** It gives access from anywhere, removes the risk of losing a single device, lets storage grow without buying hardware, and makes sharing a link instead of a copy.

**File sharing.** A share link contains a random 128-bit token, so it can't be guessed. Only people with the link can download, and the owner can turn it off at any time.

**Scalability.** The frontend is static files that a CDN can serve worldwide. The backend is stateless (JWT, no server sessions), so more instances can be added behind a load balancer. Storage and database can move to managed services that scale on their own.

**Availability.** On a cloud host, the backend can run in several instances and the storage service keeps redundant copies across data centres, so one failed machine doesn't take files offline. Locally this is a single machine, but the design doesn't block that move.

**Separation of frontend and backend.** Each can be developed, deployed and scaled on its own. The frontend finds the backend through one setting (`VITE_API_URL`).

**Deployment readiness.** All settings (secret key, database URL, upload folder, allowed origins, size limit) come from environment variables, which is how cloud hosts configure apps.

## 13. Security measures

- bcrypt password hashing
- Signed, expiring JWTs
- Ownership check on every file operation
- Filenames stripped of directory parts (`../../etc/passwd` becomes `passwd`)
- Files stored under random UUID names, never the user's name
- Storage paths resolved and checked to stay inside `uploads/`
- File-type allowlist and 10 MB size limit enforced on the server while streaming
- Same error for unknown email and wrong password, so accounts can't be enumerated
- CORS limited to the frontend's origin

## 14. Future scope

- Store files in S3 / Cloudflare R2 and metadata in PostgreSQL
- Deploy frontend to Vercel and backend to Render
- Folders and file renaming
- Expiring share links and password-protected links
- File previews for images and PDFs
- Per-user storage quotas
- Presigned URLs so large files upload straight to object storage
- Email verification and password reset
- Upload multiple files at once

## Current limitations

- Runs on one machine; files and the database are local.
- Share links point to `localhost`, so they only open on the same computer (or the same network if you use your machine's IP).
- One file per upload, up to 10 MB.
- The JWT is kept in `localStorage`, which is fine for a demo; a production app would use secure HTTP-only cookies.
- The default secret key is for development only. Set `CLOUDVAULT_SECRET_KEY` before any real deployment.
