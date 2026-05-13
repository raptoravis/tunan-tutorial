import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CreatePoll } from './CreatePoll.js';
import { PollPage } from './PollPage.js';

export function App() {
  return (
    <main>
      <h1>Voting System</h1>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </main>
  );
}
