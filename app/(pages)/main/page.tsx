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
  const [currentIndex, setCurrentIndex] = useState(0);

  // sheets fetch (poll every 15s so new responses appear)
  useEffect(() => {
    const fetchSheet = () => {
      fetch(process.env.NEXT_PUBLIC_SHEETS_URL!)
        .then((res) => res.text())
        .then((text) => {
          const json = JSON.parse(text.substring(47, text.length - 2));
          const rows = json.table.rows;
          const data = rows.map((row: any) => ({
            timestamp: row.c[0]?.f || "",
            message: row.c[1]?.v || "",
            name: row.c[2]?.v || "",
          }));
          const sorted = data.sort((a: any, b: any) => {
            const t1 = new Date(a.timestamp).getTime();
            const t2 = new Date(b.timestamp).getTime();
            return t2 - t1; // newest first
          });
          setGratitudes(sorted);
          setCurrentIndex(0); // always start from newest
        })
        .catch((err) => console.error("Error:", err));
    };

    fetchSheet();
    const interval = setInterval(fetchSheet, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // slideshow: advance every 6 seconds
  useEffect(() => {
    if (gratitudes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % gratitudes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [gratitudes]);

  // local burst animation
  const burstTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleBurst = () => {
    if (burstTimeout.current) clearTimeout(burstTimeout.current);

    const leaves: BurstLeaf[] = Array.from({ length: 18 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 260,
      y: -Math.random() * 260 - 80,
      rot: (Math.random() - 0.5) * 720,
      emoji: Math.random() > 0.5 ? "🍂" : "🍁",
    }));

    setBurstLeaves(leaves);

    burstTimeout.current = setTimeout(() => {
      setBurstLeaves([]);
      burstTimeout.current = null;
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

  const current =
    gratitudes.length > 0 ? gratitudes[currentIndex] : null;

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

      {/* slideshow card */}
      <div className="main-content">
        {current ? (
          <div className="card">
            <p className="card-msg">"{current.message}"</p>
            {current.name && current.name.trim().length > 0 && (
              <p className="card-name"> — {current.name}</p>
            )}
          </div>
        ) : (
          <div className="card">
            <p className="card-msg">Waiting for gratitudes…</p>
          </div>
        )}
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

      {/* burst leaves */}
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
