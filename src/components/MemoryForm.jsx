import React, { useState } from "react";

const MemoryForm = ({ countryName, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ country: countryName, title, date, notes });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="w-full max-w-md rounded-xl shadow-xl p-6 bg-slate-900/80 text-white backdrop-blur-lg border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold tracking-wide">Add Memory • {countryName}</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 transition"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 opacity-80">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A moment to remember"
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 opacity-80">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 opacity-80">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? Who were you with?"
              rows={4}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-indigo-400/90 text-slate-900 font-semibold hover:bg-indigo-300 transition"
          >
            Save Memory
          </button>
        </form>
      </div>
    </div>
  );
};

export default MemoryForm; 