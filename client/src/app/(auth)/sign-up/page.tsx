import { Metadata } from "next";

import AuthPageWrapper from "@/components/shared/wrapper/auth-page-wrapper";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = {
    title: "Sign Up",
    description: "Sign Up to your account",
};

const SignUpPage = () => {
    return (
        <AuthPageWrapper
            title="Create an account"
            description="Enter your email below to create an account"
            formType="SIGN_UP"
            formComponent={<SignUpForm />}
        />
    );
};

export default SignUpPage;
