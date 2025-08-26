"use client"

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { FaEnvelope, FaEye, FaEyeSlash, FaLeaf, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.gradients?.hero || "linear-gradient(135deg, #0f2419 0%, #1b4332 50%, #2d5016 100%)"};
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const LoginCard = styled(Card)`
  max-width: 440px;
  width: 100%;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: ${(props) => props.theme.shadows?.glowLarge}, ${(props) => props.theme.shadows?.xl};
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
`;

const Logo = styled.div`
  width: 72px;
  height: 72px;
  background: ${(props) => props.theme.gradients?.accent};
  border-radius: ${(props) => props.theme.borderRadius?.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"]};
  margin: 0 auto ${(props) => props.theme.spacing?.md};
  box-shadow: ${(props) => props.theme.shadows?.glow};
`;

const Title = styled.h1`
  text-align: center;
  color: ${(props) => props.theme.colors?.text};
  font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"]};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
  margin-bottom: ${(props) => props.theme.spacing?.sm};
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${(props) => props.theme.colors?.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing?.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg};
`;

const Options = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: -${(props) => props.theme.spacing?.sm};
`;

const ForgotPasswordLink = styled(Link)`
  color: ${(props) => props.theme.colors?.accent};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.medium};
  transition: color 0.3s ease;
  &:hover {
    color: ${(props) => props.theme.colors?.primary};
  }
`;

const SignUpSection = styled.div`
  text-align: center;
  margin-top: ${(props) => props.theme.spacing?.xl};
  padding-top: ${(props) => props.theme.spacing?.xl};
  border-top: 1px solid ${(props) => props.theme.colors?.border};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm};
`;

const SignUpLink = styled(Link)`
  color: ${(props) => props.theme.colors?.accent};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (credentials) => {
    setLoading(true);
    try {
      await login(credentials, true); // 'true' to remember the user
      toast.success("Login successful! Welcome back.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err.message);
      // Error toast is already handled by the API interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <Logo><FaLeaf /></Logo>
        </LogoContainer>
        <Title>Welcome Back</Title>
        <Subtitle>Sign in to continue to your dashboard.</Subtitle>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="email"
            placeholder="Email Address"
            icon={FaEnvelope}
            autoComplete="email"
            {...register("email", { 
              required: "Email is required",
              pattern: { 
                value: /^\S+@\S+$/i, 
                message: "Invalid email address" 
              } 
            })}
            error={errors.email?.message}
          />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            icon={showPassword ? FaEyeSlash : FaEye}
            onIconClick={() => setShowPassword(!showPassword)}
            autoComplete="current-password"
            {...register("password", { 
              required: "Password is required" 
            })}
            error={errors.password?.message}
          />
          <Options>
            <ForgotPasswordLink to="/forgot-password">Forgot Password?</ForgotPasswordLink>
          </Options>
          <Button type="submit" size="lg" fullWidth loading={loading} disabled={loading}>
            {loading ? <LoadingSpinner /> : "Sign In"}
          </Button>
        </Form>
        <SignUpSection>
          Don't have an account?{" "}
          <SignUpLink to="/register">Sign up for free</SignUpLink>
        </SignUpSection>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;