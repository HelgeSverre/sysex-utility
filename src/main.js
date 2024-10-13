import Alpine from "alpinejs";
import focus from "@alpinejs/focus";
import Tooltip from "@ryangjchandler/alpine-tooltip";

import app from "./app.js";
import "./style.css";

// Plugins
Alpine.plugin(focus);
Alpine.plugin(Tooltip);

// Components
Alpine.data("app", app);

// Start Alpine.js
Alpine.start();
