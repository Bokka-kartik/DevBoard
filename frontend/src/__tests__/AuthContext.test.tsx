import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../../auth/AuthContext";
import { mockUser, mockToken } from "../fixtures/data";

// Helper component to read context values in tests.
const ReadContext = () => {
  const { user, token } = useAuth();
  return (
    <div>
      <span data-testid="username">{user?.username ?? "none"}</span>
      <span data-testid="token">{token ?? "none"}</span>
    </div>
  );
};

const LoginButton = () => {
  const { login } = useAuth();
  return <button onClick={() => login(mockToken, mockUser)}>Login</button>;
};

const LogoutButton = () => {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
};

beforeEach(() => {
  localStorage.clear();
});

describe("AuthContext", () => {
  it("starts unauthenticated when localStorage is empty", () => {
    render(
      <AuthProvider>
        <ReadContext />
      </AuthProvider>
    );
    expect(screen.getByTestId("username").textContent).toBe("none");
    expect(screen.getByTestId("token").textContent).toBe("none");
  });

  it("persists user and token after login()", async () => {
    render(
      <AuthProvider>
        <LoginButton />
        <ReadContext />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByTestId("username").textContent).toBe(mockUser.username);
    expect(localStorage.getItem("token")).toBe(mockToken);
  });

  it("clears user and localStorage after logout()", async () => {
    render(
      <AuthProvider>
        <LoginButton />
        <LogoutButton />
        <ReadContext />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));
    await userEvent.click(screen.getByRole("button", { name: /logout/i }));

    expect(screen.getByTestId("username").textContent).toBe("none");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("restores session from localStorage on mount", () => {
    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <ReadContext />
      </AuthProvider>
    );
    expect(screen.getByTestId("username").textContent).toBe(mockUser.username);
  });
});
