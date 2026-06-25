# Rubik's Cube Playground & PLL Trainer

A React and Node.js application featuring an interactive 3D Rubik's Cube simulator, a 2D net editor, an automatic solver, and a speedcubing PLL Trainer.

## Features

- **3D Simulator & Net Editor:** Paint custom configurations on a 2D flat net and sync them directly to the 3D cube. Invalid configurations are automatically corrected to the nearest solvable physical state.
- **Optimal Solver:** Generates optimal solutions (under 22 moves) in under a second using a Web Worker implementation of Kociemba's Two-Phase algorithm (`cubejs`).
- **PLL Trainer:** Train all 21 PLL (Permutation of the Last Layer) cases with automatic setup scramble (mathematical inverse) generation.
- **csTimer-style Timer:** Precision spacebar hold-to-start timing engine with visual cues.
- **Local Stats & History:** Solves, PB, average of 5 (Ao5), and average of 12 (Ao12) are saved and calculated on the client using `localStorage`.

## Tech Stack

- **Frontend:** React, `@cubing/twisty`, `cubejs`, Vanilla CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose)

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or remote Atlas connection)

### Environment Configuration

1. Create a `.env` file in the `server` directory (see `server/.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/rubiks_trainer
   ```

2. Create a `.env` file in the `client` directory (see `client/.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Project

Open two terminal windows:

#### Start Backend
```bash
cd server
npm install
npm run dev
```
*The server runs on port 5000 and automatically seeds case data to MongoDB on startup.*

#### Start Frontend
```bash
cd client
npm install
npm run dev
```
*The React + Vite development server runs at `http://localhost:5173`.*
