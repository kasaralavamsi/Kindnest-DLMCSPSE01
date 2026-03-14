# Kindnest Project

## Project Structure

- `client/` — React frontend (Vite)
- `server/` — Node.js/Express backend

---

## Setup Instructions

### 1. Install Dependencies

#### Client
```bash
cd client
npm install
```

#### Server
```bash
cd server
npm install
```

---

## Running the Project

### Start the Client (Frontend)
```bash
cd client
npm run dev
```

### Start the Server (Backend)
```bash
cd server
npm start
```

---

## Testing

### Backend (server)
- **Run all tests:**
  ```bash
  cd server
  npx jest
  ```

### Frontend (client)
- **Run all tests:**
  ```bash
  cd client
  npx jest
  ```

---

## Notes
- Backend tests use **Jest** and **Supertest** for API testing.
- Frontend tests use **Jest** and **@testing-library/react**.
- Add more test files in the `src/__tests__/` folders in both client and server as needed.


