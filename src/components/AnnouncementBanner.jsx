import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const marqueeRef = useRef(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .lte("created_at", new Date().toISOString())
      .gte("expires_at", today)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  if (announcements.length === 0) return null;

  const text = announcements
    .map((a) => a.message)
    .join("   •   ");

  return (
    <div
      className="announcement-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      title="Обавештења — само видљиво администраторима"
    >
      <div className="announcement-label">
        <span className="announcement-icon">📢</span>
        <span>ОБАВЕШТЕЊА</span>
      </div>
      <div className="announcement-track">
        <div
          ref={marqueeRef}
          className={`announcement-marquee${isPaused ? " paused" : ""}`}
        >
          <span className="announcement-text">{text}</span>
          {/* Duplicate for seamless loop */}
          <span className="announcement-sep" aria-hidden="true">   •   </span>
          <span className="announcement-text" aria-hidden="true">{text}</span>
          <span className="announcement-sep" aria-hidden="true">   •   </span>
        </div>
      </div>
    </div>
  );
}
