import "./App.scss";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./Components/LoginForm/LoginForm";
import CreateAccountForm from "./components/CreateAccountForm/CreateAccountForm";

function App() {
  return (
    <BrowserRouter>
      <CreateAccountForm />
      <Routes>
        <Route />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
