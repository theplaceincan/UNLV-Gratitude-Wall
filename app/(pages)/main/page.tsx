"use client";

import "../../css/main.css";
import { useState, useEffect, useRef } from "react";
import { db } from "@/app/firebase";
import { ref, push, onChildAdded } from "firebase/database";

type BurstLeaf = {
  id: number;
  x: number;
  y: number;
  rot: number;
  emoji: string;
};

export default function Main() {
  const [gratitudes, setGratitudes] = useState<any[]>([]);
  const [burstLeaves, setBurstLeaves] = useState<BurstLeaf[]>([]);

  // sheets fetch
  useEffect(() => {
    fetch(
      process.env.NEXT_PUBLIC_SHEETS_URL!
    )
      .then((res) => res.text())
      .then((text) => {
        const json = JSON.parse(text.substring(47, text.length - 2));
        const rows = json.table.rows;
        const data = rows.map((row: any) => ({
          timestamp: row.c[0]?.f || "",
          message: row.c[1]?.v || "",
          name: row.c[2]?.v || "",
        }));
        setGratitudes(data.reverse());
      })
      .catch((err) => console.error("Error:", err));
  }, []);

  // local burst animation
  const burstTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleBurst = () => {
    // cancel any previous animations
  if (burstTimeout.current) {
    clearTimeout(burstTimeout.current);
  }

    // create new burst leaves
  const leaves: BurstLeaf[] = Array.from({ length: 18 }).map((_, i) => ({
    id: Date.now() + i,
    x: (Math.random() - 0.5) * 260,
    y: -Math.random() * 260 - 80,
    rot: (Math.random() - 0.5) * 720,
    emoji: Math.random() > 0.5 ? "🍂" : "🍁",
  }));

  setBurstLeaves(leaves);

    // schedule removal of leaves — but ensure only the NEW timeout runs
  burstTimeout.current = setTimeout(() => {
    setBurstLeaves([]);
    burstTimeout.current = null; // reset
  }, 900);
};

  // send burst to Firebase when *you* click
  const sendBurst = () => {
    const burstsRef = ref(db, "bursts");
    push(burstsRef, { ts: Date.now() });
  };

  // listen for ALL bursts globally
  useEffect(() => {
    const burstsRef = ref(db, "bursts");
    onChildAdded(burstsRef, () => {
      handleBurst();
    });
  }, []);

  return (
    <div className="main-container">
      <div className="title-section">
        <p className="main-title">🍂 Gratitude Wall 🍂</p>
        <p className="main-subtitle">What We're Grateful For</p>
      </div>

      {/* falling leaves */}
      <div className="leaf" style={{ left: "10%", animationDelay: "0s" }}>
        🍁
      </div>
      <div className="leaf" style={{ left: "30%", animationDelay: "3s" }}>
        🍂
      </div>
      <div className="leaf" style={{ left: "50%", animationDelay: "6s" }}>
        🍁
      </div>
      <div className="leaf" style={{ left: "70%", animationDelay: "9s" }}>
        🍂
      </div>
      <div className="leaf" style={{ left: "90%", animationDelay: "12s" }}>
        🍁
      </div>

      {/* gratitude cards */}
      <div className="main-content">
        {gratitudes.map((item: any, i: number) => (
          <div key={i} className="card">
            <p className="card-msg">"{item.message}"</p>
            {item.name && item.name.trim().length > 0 && (
              <p className="card-name"> ─ {item.name}</p>
            )}
          </div>
        ))}
      </div>

      {/* bottom-right burst button */}
      <button className="burst-button" onClick={sendBurst}>
        🍁
      </button>

      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://unlv-gratitude-wall.vercel.app"
        alt="QR Code"
        className="qr-code"
      />

      {/* burst leaves (everyone sees these when *anyone* clicks) */}
      {burstLeaves.map((leaf) => (
        <span
          key={leaf.id}
          className="burst-leaf"
          style={
            {
              "--x": `${leaf.x}px`,
              "--y": `${leaf.y}px`,
              "--rot": `${leaf.rot}deg`,
            } as React.CSSProperties
          }
        >
          {leaf.emoji}
        </span>
      ))}
    </div>
  );
}
