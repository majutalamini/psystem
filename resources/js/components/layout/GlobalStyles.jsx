import { T } from "../../styles/theme";

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      html, body, #root { margin: 0; padding: 0; height: 100%; }
      table { font-family: 'Inter', sans-serif; }
      select { font-family: 'Inter', sans-serif; }
      input:focus, select:focus { border-color: ${T.primary} !important; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      .profile-tabs { scrollbar-width: none; }
      .profile-tabs::-webkit-scrollbar { display: none; }
      ::-webkit-scrollbar-thumb { background: #D8DCE9; border-radius: 8px; }
      .spin { animation: spin 0.8s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .print-area { display: none; }
      @media print {
        .app-shell { display: none !important; }
        .print-area { display: block !important; }
      }
    `}</style>
  );
}
