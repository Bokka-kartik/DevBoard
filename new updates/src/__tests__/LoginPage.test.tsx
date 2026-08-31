import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";
import LoginPage from "../../pages/LoginPage";
import { AuthProvider } from "../../auth/AuthContext";
import { LOGIN } from "../../graphql/operations";
import { mockUser, mockToken } from "../fixtures/data";

const renderLogin = (mocks = []) =>
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    </MockedProvider>
  );

describe("LoginPage — behaviour", () => {
  it("renders sign-in form by default", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/^email$/i)).not.toBeInTheDocument();
  });

  it("toggles to the registration form and shows the email field", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: /create an account/i }));
    expect(screen.getByPlaceholderText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows an error message when login fails", async () => {
    const mocks = [
      {
        request: {
          query: LOGIN,
          variables: { usernameOrEmail: "alice", password: "wrongpass" },
        },
        error: new Error("Invalid credentials"),
      },
    ];
    renderLogin(mocks as any);

    await userEvent.type(screen.getByPlaceholderText(/username or email/i), "alice");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("stores token in localStorage on successful login", async () => {
    const mocks = [
      {
        request: {
          query: LOGIN,
          variables: { usernameOrEmail: "alice", password: "Password1!" },
        },
        result: { data: { login: { token: mockToken, user: mockUser } } },
      },
    ];
    renderLogin(mocks as any);

    await userEvent.type(screen.getByPlaceholderText(/username or email/i), "alice");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "Password1!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await vi.waitFor(() => {
      expect(localStorage.getItem("token")).toBe(mockToken);
    });
  });
});
