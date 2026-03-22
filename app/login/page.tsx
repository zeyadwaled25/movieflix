"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, loginUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      if (await isLoggedIn()) {
        router.replace("/");
      }
    };

    void checkAuth();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const success = await loginUser(email, password);

    if (!success) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          <div className="login-form bg-dark p-4 rounded-3 shadow">
            <h2 className="text-center mb-4 text-danger">MOVIEFLIX</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control bg-dark text-white"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control bg-dark text-white"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger w-100 mb-3">
                Login
              </button>
              <div className="text-center">
                <Link href="/register" className="text-secondary text-decoration-none">
                  Don&apos;t have an account? Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}