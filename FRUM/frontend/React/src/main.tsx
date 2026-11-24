// most if not all css came from opencode agent suit images are mine. Frontend structure also from opencode agent. Both handwritten and machine code for the pages source code.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import "./index.css";
import "./styles/shared.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);
