import { type ReactNode, useEffect, useState } from "react";
import { auth } from "@/backend";
import type { AppUser } from "@/backend/types";
import { AuthContext } from "@/contexts/useAuth";

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    return auth.onChange((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = (email: string, password: string) =>
    auth.signIn(email, password);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
