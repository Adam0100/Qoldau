import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";
import ruRU from "antd/locale/ru_RU";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./style.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={ruRU}
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
        <HashRouter>
          <App />
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
