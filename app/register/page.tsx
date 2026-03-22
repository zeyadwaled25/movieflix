"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, registerUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

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
    setErrors([]);
    setSuccessMessage("");

    const validationErrors = await registerUser(name, email, password);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSuccessMessage("Registration successful! Redirecting to login...");
    window.setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          {errors.length > 0 ? <div className="alert alert-danger" dangerouslySetInnerHTML={{ __html: errors.join("<br>") }} /> : null}
          {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

          <div className="login-form bg-dark p-4 rounded-3 shadow">
            <h2 className="text-center mb-4 text-danger">MOVIEFLIX</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="registerName" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white"
                  id="registerName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="registerEmail" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control bg-dark text-white"
                  id="registerEmail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="registerPassword" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control bg-dark text-white"
                  id="registerPassword"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger w-100 mb-3">
                Register
              </button>
              <div className="text-center">
                <Link href="/login" className="text-secondary text-decoration-none">
                  Already have an account? Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}