import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .login-logo {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 0 8px;
          margin: 0 -8px;
        }
      `}</style>
      {children}
    </>
  );
}
