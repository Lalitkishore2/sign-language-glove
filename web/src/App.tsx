/**
 * @fileoverview Root Application component wrapping all providers and routing controls.
 */
import { RouterProvider } from "react-router-dom";
import { AppRouter } from "./routes";
import { ThemeProvider } from "./providers/ThemeProvider";
import { StoreProvider } from "./providers/StoreProvider";
import { MotionProvider } from "./providers/MotionProvider";
import { AuthProvider } from "./providers/AuthProvider";

export function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <MotionProvider>
          <AuthProvider>
            <RouterProvider router={AppRouter} />
          </AuthProvider>
        </MotionProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
