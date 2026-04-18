type SupabaseLoginClient = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      error: { message: string } | null;
    }>;
  };
};

export async function loginWithPassword(
  client: SupabaseLoginClient,
  email: string,
  password: string
): Promise<{ error: string | null }> {
  try {
    // Log the login attempt
    console.log("[SyncChat Auth] Login attempt for email:", email);
    
    if (!email || !password) {
      return { error: "Please enter both email and password" };
    }

    const { error } = await client.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      console.error("[SyncChat Auth] Login error:", {
        message: error?.message,
        status: (error as any)?.status,
        code: (error as any)?.code
      });

      // Provide user-friendly error messages
      const errorMessage = error?.message || "Unknown error occurred";
      
      if (errorMessage.includes("Invalid login credentials")) {
        return { error: "Invalid email or password. Please check your credentials." };
      } else if (errorMessage.includes("Email not confirmed")) {
        return { error: "Please verify your email address before signing in." };
      } else if (errorMessage.includes("User not found")) {
        return { error: "No account found with this email address." };
      } else if (errorMessage.includes("User is disabled")) {
        return { error: "Your account has been disabled. Please contact support." };
      } else if (errorMessage.includes("Too many")) {
        return { error: "Too many login attempts. Please try again later." };
      }

      return { error: errorMessage };
    }

    console.log("[SyncChat Auth] Login successful for email:", email);
    return { error: null };
  } catch (cause) {
    console.error("[SyncChat Auth] Unexpected login error:", cause);
    const errorMessage = cause instanceof Error ? cause.message : "Unable to sign in. Please try again.";
    return { error: errorMessage };
  }
}
