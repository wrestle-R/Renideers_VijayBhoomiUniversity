import { useState } from "react";
import { useUser } from "../context/UserContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isLogin = searchParams.get("mode") !== "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { login, signup, googleLogin } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!fullName) return; 
        await signup(email, password, fullName);
      }
      navigate("/dashboard");
    } catch (error) {
      // Error handled in context
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      navigate("/dashboard");
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-20">
      <Navbar />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login to Trekky" : "Create an Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Welcome back! Enter your details." : "Join Trekky today."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  className="border-2 border-gray-300 dark:border-gray-600"
                  id="fullName" 
                  placeholder="John Doe" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                className="border-2 border-gray-300 dark:border-gray-600"
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                className="border-2 border-gray-300 dark:border-gray-600"
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full">
              {isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full border-2 border-gray-300 dark:border-gray-600" onClick={handleGoogleLogin}>
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => setSearchParams({ mode: isLogin ? "signup" : "login" })}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
