import { ImageResponse } from "next/og";

export const alt = "Biluxr — One relationship for an exceptional life.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const B = "M0 0V20 M0 0H6.5A4.75 4.75 0 0 1 6.5 9.5H0 M0 9.5H7.5A5.25 5.25 0 0 1 7.5 20H0";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#08080a",
        color: "#f3efe8",
        position: "relative",
      }}
    >
      <svg
        width="980"
        height="980"
        viewBox="0 0 1000 1000"
        style={{ position: "absolute", right: -420, top: -120 }}
      >
        <circle
          cx="500"
          cy="500"
          r="498"
          fill="none"
          stroke="rgba(243,239,232,0.16)"
          strokeWidth="2"
        />
      </svg>
      <svg width="64" height="64" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="19" fill="none" stroke="#f3efe8" strokeWidth="1.1" />
        <path transform="translate(13.8 10)" d={B} fill="none" stroke="#f3efe8" strokeWidth="1.1" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 88, lineHeight: 1, letterSpacing: -3, fontFamily: "serif" }}>
          One relationship.
        </div>
        <div
          style={{
            fontSize: 88,
            lineHeight: 1.1,
            letterSpacing: -3,
            fontFamily: "serif",
            fontStyle: "italic",
            color: "#c9c3b8",
          }}
        >
          Wherever life moves.
        </div>
        <div style={{ marginTop: 40, fontSize: 22, letterSpacing: 6, color: "#a29c91" }}>
          BILUXR · PRIVATE MEMBERSHIP
        </div>
      </div>
    </div>,
    size,
  );
}
