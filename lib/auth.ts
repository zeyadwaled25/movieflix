export type User = {
  id: string;
  name: string;
  email: string;
};

type ApiError = {
  message?: string;
  errors?: string[];
};

async function readError(response: Response): Promise<ApiError> {
  try {
    return (await response.json()) as ApiError;
  } catch {
    return { message: "Unexpected error" };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", { method: "GET" });
    if (!response.ok) return null;
    const data = (await response.json()) as { user: User };
    return data.user;
  } catch {
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function registerUser(name: string, email: string, password: string): Promise<string[]> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (response.ok) return [];

    const error = await readError(response);
    if (error.errors && error.errors.length > 0) return error.errors;
    return [error.message || "Registration failed"];
  } catch {
    return ["Registration failed"];
  }
}

export async function loginUser(email: string, password: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function logoutUser() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // noop
  }
}