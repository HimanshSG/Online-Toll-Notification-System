import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faMap, 
  faSave, 
  faLocationArrow, 
  faBell, 
  faHome, 
  faUser, 
  faRoute, 
  faSignOutAlt,
  faCog,
  faHistory,
  faWallet,
  faList,
  faMapMarkerAlt,
  faPlus,
  faMinus,
  faRoad,
  faChevronRight,
  faLock,
  faArrowLeft,
  faSpinner,
  faInfoCircle,
  faExclamationTriangle,
  faBellSlash,
} from '@fortawesome/free-solid-svg-icons';
import App from "./App";
import "./index.css";

import "./lib/icons";
import 'mapbox-gl/dist/mapbox-gl.css';


createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

library.add(
  faMap, faSave, faLocationArrow, faBell, faHome, faUser, faRoute,
  faSignOutAlt, faCog, faHistory, faWallet, faList, faMapMarkerAlt,
  faPlus, faMinus, faRoad, faChevronRight, faLock, faArrowLeft,
  faSpinner, faInfoCircle, faExclamationTriangle, faBellSlash
);
