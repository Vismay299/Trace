import { ImageResponse } from "next/og";
import { SITE } from "@/content/copy";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070808",
          color: "#ede6d6",
          padding: "72px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "999px",
              border: "1px solid rgba(237,230,214,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
            }}
          >
            T
          </div>
          <div style={{ fontSize: "28px", letterSpacing: "0px" }}>TRACE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ color: "#3ddc97", fontSize: "26px", marginBottom: "28px" }}
          >
            YOU SHIP CODE. TRACE SHIPS YOUR STORY.
          </div>
          <div
            style={{
              fontSize: "86px",
              lineHeight: 1.02,
              maxWidth: "920px",
              fontWeight: 700,
            }}
          >
            {SITE.tagline}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
