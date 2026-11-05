import { BrowserRouter } from "react-router";

import { AppRoutes } from "./routes";
import { NavigationEffects } from "./NavigationEffects";

export function App() {
  return (
    <BrowserRouter>
      <NavigationEffects />
      <AppRoutes />
    </BrowserRouter>
  );
}
