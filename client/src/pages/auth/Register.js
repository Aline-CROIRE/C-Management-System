"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import { motion } from "framer-motion"
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaPhone, FaArrowLeft } from "react-icons/fa"
import { MdInventory, MdAgriculture, MdRecycling, MdConstruction } from "react-icons/md"
import { useAuth } from "../../contexts/AuthContext"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Card from "../../components/common/Card"
import Logo from "../../components/common/Logo"
import toast from "react-hot-toast"

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing?.xl};
  background: ${(props) => props.theme.gradients?.hero};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 25% 25%, rgba(64, 145, 108, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(45, 80, 22, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
`

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 650px;
  position: relative;
  z-index: 1;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl};

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: ${(props) => props.theme.spacing?.lg};
  }

  h1 {
    font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"]};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.textOnDark};
    margin-bottom: ${(props) => props.theme.spacing?.sm};
  }

  p {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg};
    color: ${(props) => props.theme.colors?.textOnDarkSecondary};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.medium};
  }
`

const StyledCard = styled(Card)`
  padding: ${(props) => props.theme.spacing?.xl};
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: ${(props) => props.theme.shadows?.xl};
  backdrop-filter: blur(15px);
  border-radius: ${(props) => props.theme.borderRadius?.["2xl"]};

  @media (max-width: ${(props) => props.theme.breakpoints?.sm}) {
    padding: ${(props) => props.theme.spacing?.lg};
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg};
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.spacing?.lg};

  @media (max-width: ${(props) => props.theme.breakpoints?.sm}) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.theme.spacing?.lg};
  }
`

const ModuleSelection = styled.div`
  h3 {
    color: ${(props) => props.theme.colors?.text};
    font-size: ${(props) => props.theme.typography?.fontSize?.lg};
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    margin-bottom: ${(props) => props.theme.spacing?.lg};
    text-align: center;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${(props) => props.theme.spacing?.md};

    @media (max-width: ${(props) => props.theme.breakpoints?.sm}) {
      grid-template-columns: 1fr;
    }
  }
`

const ModuleCard = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${(props) => props.theme.spacing?.lg};
  border: 2px solid ${(props) => props.theme.colors?.border};
  border-radius: ${(props) => props.theme.borderRadius?.xl};
  cursor: pointer;
  transition: all ${(props) => props.theme.animation?.duration?.normal} ${(props) => props.theme.animation?.easing?.default};
  background: ${(props) => props.theme.colors?.surface};
  position: relative;
  overflow: hidden;

  &.selected {
    border-color: ${(props) => props.theme.colors?.accent};
    box-shadow: ${(props) => props.theme.shadows?.md};
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${(props) => props.theme.shadows?.lg};
  }

  .icon {
    font-size: 2rem;
    color: ${(props) => props.theme.colors?.accent};
    margin-bottom: ${(props) => props.theme.spacing?.md};
  }

  .name {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
    color: ${(props) => props.theme.colors?.text};
    font-size: ${(props) => props.theme.typography?.fontSize?.base};
    margin-bottom: ${(props) => props.theme.spacing?.xs};
  }

  .description {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm};
    color: ${(props) => props.theme.colors?.textSecondary};
    line-height: 1.4;
    text-align: center;
  }

  input { display: none; }
`

const LoginSection = styled.div`
  text-align: center;
  margin-top: ${(props) => props.theme.spacing?.xl};
  padding-top: ${(props) => props.theme.spacing?.lg};
  border-top: 1px solid ${(props) => props.theme.colors?.border};

  p {
    color: ${(props) => props.theme.colors?.textSecondary};
    margin-bottom: ${(props) => props.theme.spacing?.sm};
    font-size: ${(props) => props.theme.typography?.fontSize?.sm};
  }
`

const LoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm};
  color: ${(props) => props.theme.colors?.accent};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm};
  padding: ${(props) => props.theme.spacing?.xs} ${(props) => props.theme.spacing?.md};
  border-radius: ${(props) => props.theme.borderRadius?.lg};
  transition: all ${(props) => props.theme.animation?.duration?.normal} ${(props) => props.theme.animation?.easing?.default};

  &:hover {
    background: ${(props) => `${props.theme.colors?.accent}1A`};
    transform: translateY(-2px);
  }
`

const modules = [
  { id: "IMS", name: "Inventory", icon: MdInventory, description: "Track stock and control inventory flow." },
  { id: "ISA", name: "Agriculture", icon: MdAgriculture, description: "Manage crops, fields, and resources." },
  { id: "Waste", name: "Waste Mgmt", icon: MdRecycling, description: "Oversee waste and recycling programs." },
  { id: "Construction Sites", name: "Construction Sites", icon: MdConstruction, description: "Manage sites and heavy equipment." },
]

const Register = () => {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [selectedModules, setSelectedModules] = useState([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const password = watch("password")

  const handleModuleToggle = (moduleId) => {
    setSelectedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  const onSubmit = async (data) => {
    if (selectedModules.length === 0) {
      toast.error("Please select at least one module.")
      return
    }

    setLoading(true)
    try {
      await signup({ ...data, modules: selectedModules })
      toast.success("Registration successful! Welcome.")
      navigate("/dashboard")
    } catch (error) {
      console.error("An error occurred during signup:", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <FormContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Header>
          <div className="logo-wrapper">
            <Logo size="64px" />
          </div>
          <h1>Create Your Account</h1>
          <p>Begin your journey with our all-in-one platform.</p>
        </Header>
        <StyledCard>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Input icon={FaUser} placeholder="First Name" {...register("firstName", { required: "First name is required" })} error={errors.firstName?.message} />
              <Input icon={FaUser} placeholder="Last Name" {...register("lastName", { required: "Last name is required" })} error={errors.lastName?.message} />
            </Row>
            <Input icon={FaEnvelope} type="email" placeholder="Email Address" {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })} error={errors.email?.message} />
            <Row>
              <Input icon={FaBuilding} placeholder="Company Name" {...register("company", { required: "Company name is required" })} error={errors.company?.message} />
              <Input icon={FaPhone} placeholder="Phone Number" {...register("phone")} error={errors.phone?.message} />
            </Row>
            <Row>
              <Input icon={FaLock} type="password" placeholder="Password" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })} error={errors.password?.message} />
              <Input icon={FaLock} type="password" placeholder="Confirm Password" {...register("confirmPassword", { required: "Please confirm your password", validate: (value) => value === password || "Passwords do not match" })} error={errors.confirmPassword?.message} />
            </Row>
            <ModuleSelection>
              <h3>Select Your Business Modules</h3>
              <div className="modules-grid">
                {modules.map((module) => (
                  <ModuleCard key={module.id} className={selectedModules.includes(module.id) ? "selected" : ""}>
                    <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={() => handleModuleToggle(module.id)} />
                    <module.icon className="icon" />
                    <div className="name">{module.name}</div>
                    <div className="description">{module.description}</div>
                  </ModuleCard>
                ))}
              </div>
            </ModuleSelection>
            <Button type="submit" loading={loading} fullWidth size="lg">
              Create Account
            </Button>
          </Form>
          <LoginSection>
            <p>Already have an account?</p>
            <LoginLink to="/login">
              <FaArrowLeft /> Sign In
            </LoginLink>
          </LoginSection>
        </StyledCard>
      </FormContainer>
    </Container>
  )
}

export default Register