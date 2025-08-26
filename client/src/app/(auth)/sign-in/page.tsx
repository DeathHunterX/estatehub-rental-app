import AuthPageWrapper from "@/components/shared/wrapper/auth-page-wrapper";
import { Metadata } from "next";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign In to your account",
};

const SignInPage = () => {
    return (
        <AuthPageWrapper
            title="Sign in to your account"
            description="Enter your email below to sign in to your account"
            formType="SIGN_IN"
            formComponent={<SignInForm />}
        />
    );
};

export default SignInPage;
