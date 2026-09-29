import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";
import enUS from "antd/locale/en_US";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./style.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={enUS}
      theme={{
        token: {
          colorPrimary: "#075137",
          colorText: "#293b4b",
          borderRadius: 16,
          fontFamily: "Arial, Segoe UI, sans-serif",
          controlHeight: 44,
        },
        components: {
          Button: { primaryShadow: "none" },
          Card: { paddingLG: 24 },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
