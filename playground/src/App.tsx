import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  return (
    <div className="app-page">
      <Header />
      <main className="app-content">
        <img
          src="/studio-toolkit-logo-name.png"
          alt="Studio Toolkit"
          style={{ width: "300px" }}
        />
        <p>Engineered in color. Designed for happiness.</p>
      </main>
      <Footer />
    </div>
  );
}

export default App;
