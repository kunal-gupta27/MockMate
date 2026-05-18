import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { jwtDecode } from "jwt-decode";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const isExpired = decodedToken?.exp && decodedToken.exp * 1000 <= Date.now();

      if (isExpired) {
        localStorage.removeItem("token");
        return;
      }

      navigate("/admin", { replace: true });
    } catch {
      localStorage.removeItem("token");
    }
  }, [navigate]);

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp && formData.password !== formData.confirmPassword) {
      toast("Passwords do not match ❌");
      return;
    }

    const apiBaseUrl = (
      import.meta.env.VITE_REACT_APP_BASE_URL || "http://localhost:5000"
    ).replace(/\/$/, "");
    const url = isSignUp
      ? `${apiBaseUrl}/api/auth/signup`
      : `${apiBaseUrl}/api/auth/signin`;

    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const { data } = await axios.post(
        url,
        payload
      );

      if (data.token) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      }

      toast(
        isSignUp
          ? "Account created successfully!"
          : "Logged in successfully!"
      );

      const redirectPath = location.state?.from?.pathname || "/admin";
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast(
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <Card className="bg-black bg-opacity-50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">
                {isSignUp ? "Register" : "Login"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp
                  ? "Create your account"
                  : "Login to continue"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">

                  {/* Email */}
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label>Password</Label>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* ✅ Confirm Password only in signup */}
                  {isSignUp && (
                    <div>
                      <Label>Confirm Password</Label>
                      <Input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white p-2 rounded"
                  >
                    {loading ? (
                      "Loading..."
                    ) : isSignUp ? (
                      "Register"
                    ) : (
                      "Login"
                    )}
                  </button>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => toast("Google login coming soon")}
                    className="border p-2 rounded flex items-center justify-center"
                  >
                    <FcGoogle className="mr-2" />
                    Google
                  </button>
                </div>
              </form>
            </CardContent>

            {/* Toggle */}
            <div className="text-center mt-4">
              {isSignUp
                ? "Already have an account?"
                : "Don't have an account?"}

              <span
                className="text-blue-500 cursor-pointer ml-2"
                onClick={toggleMode}
              >
                {isSignUp ? "Login" : "Register"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
