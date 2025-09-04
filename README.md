# Backend Interview Challenge

Hi Hiring Team, I am Shivansh Rajput, Final Year CSE Student from IIIT Ranchi.
This project is my implementation of the PearlThoughts Backend Interview Challenge. It provides task management APIs with sync capabilities using SQLite.

---

## Running Locally

### Prerequisites

* Node.js 
* npm

### Installation

1.  Clone the repository:
    ```bash
    git clone git@github.com:ShivanshRajput/backend-interview-challenge.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd backend-interview-challenge
    ```
3.  Copy environment variables:
    ```bash
    cp .env.example .env
    ```
4.  Install the dependencies:
    ```bash
    npm install
    ```

### Start Server

To start the development server, run:
```bash
npm run dev
```
The server will start by default on `http://localhost:3000`.

---

## Testing & Linting

### Run Tests

Execute all unit and integration tests with:
```bash
npm test
```

### Lint Check

Check the codebase for linting errors:
```bash
npm run lint
```

P.S. I was able to eleminate all errors, but warnings are still being generated, as the scope of this assignment demands for no errors to be present, thus that is delivered. 

### Type Check

Run the TypeScript compiler to check for type errors:
```bash
npm run typecheck
```

---

## Deployment

The Template originaly contains conflics in cjs and es6 moduling that causes build to fail. thus no deployment 

---


## Screencast
    
A screencast explaining the project, including a demo and code walkthrough, is available here:

-> **[Video Link - YouTube](https://youtu.be/u9qcqQeevEA?si=F9xLlyztsSZEWRnL)**
-> **[Video Link - Drive](https://drive.google.com/file/d/1OTAfDUPddbstNDWpS70g62xbBXrQFOPC/view)**

---

## Assumptions Made

* **Storage:** Used SQLite as the primary storage engine as provided in the starter template.
* **Synchronization:** The sync strategy assumes optimistic updates. Conflicts are resolved based on the last-updated timestamp (`last_updated` field).
* **Error Handling:** All API errors return a standardized JSON response containing `error`, `timestamp`, and `path`.
* **Hosting:** The project is deployed on a free-tier service - Vercel. The link is provided above

---

## Scripts

A summary of the available `npm` scripts:

* `npm run dev` → Starts the server in development mode with hot-reloading.
* `npm run build` → Compiles the TypeScript code to JavaScript.
* `npm run start` → Runs the compiled JavaScript output from the `build` directory.
* `npm run lint` → Runs ESLint to analyze the code for style and quality.
* `npm run typecheck` → Runs the TypeScript type checker.
* `npm test` → Executes the test suite using Jest.