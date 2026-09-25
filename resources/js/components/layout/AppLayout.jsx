import DataProvider from "../../context/DataProvider";
import { T } from "../../styles/theme";
import GlobalStyles from "./GlobalStyles";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
  return (
    <DataProvider>
      <div style={{ fontFamily: "'Inter', sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
        <GlobalStyles />

        <div className="app-shell" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <Header />
          <div style={{ flex: 1, minWidth: 0, display: "flex", overflow: "hidden" }}>
            <Sidebar />
            <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
              <div style={{ padding: "20px 32px 48px" }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DataProvider>
  );
}
