import "./App.scss";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./Components/LoginForm/LoginForm";

function App() {
  return (
    <BrowserRouter>
      <LoginForm />
      <Routes>
        <Route />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
