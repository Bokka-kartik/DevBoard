import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { LOGIN, REGISTER } from "../graphql/operations";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        const { data } = await registerMutation({
          variables: { username, email, password },
        });
        login(data.register.token, data.register.user);
      } else {
        const { data } = await loginMutation({
          variables: { usernameOrEmail: username, password },
        });
        login(data.login.token, data.login.user);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  const loading = loginLoading || registerLoading;

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>DevBoard</h1>
        <p className="subtitle">{isRegister ? "Create an account" : "Sign in to continue"}</p>

        <input
          placeholder={isRegister ? "Username" : "Username or email"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {isRegister && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : isRegister ? "Sign up" : "Sign in"}
        </button>

        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
        >
          {isRegister ? "Have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}
