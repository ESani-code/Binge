import "./App.css";

import HomeView from "./pages/HomeView";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      <Footer />
    </>
  );
};

export default App;
