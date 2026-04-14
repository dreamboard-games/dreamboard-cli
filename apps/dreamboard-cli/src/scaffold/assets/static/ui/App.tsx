export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, #fff8d6 0%, #fdfbf7 48%, #f4efe3 100%)",
        color: "#2d2d2d",
      }}
    >
      <section
        style={{
          width: "min(560px, 100%)",
          border: "3px solid #2d2d2d",
          borderRadius: "24px 18px 26px 20px / 18px 26px 18px 24px",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "8px 8px 0 0 #2d2d2d",
          padding: "28px 24px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Dreamboard UI
        </p>
        <h1
          style={{
            margin: "12px 0 10px",
            fontSize: "clamp(32px, 6vw, 52px)",
            lineHeight: 1,
          }}
        >
          UI Loaded
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            lineHeight: 1.5,
          }}
        >
          The iframe runtime is connected correctly. Replace
          <code style={{ marginLeft: 4, marginRight: 4 }}>ui/App.tsx</code>
          with your game interface to render the real experience here.
        </p>
      </section>
    </main>
  );
}
