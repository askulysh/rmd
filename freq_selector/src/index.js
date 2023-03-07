import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@forevolve/bootstrap-dark/dist/css/bootstrap-dark.css";

import LoaderWrapper from "./LoaderWrapper";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LoaderWrapper />
  </React.StrictMode>
);
