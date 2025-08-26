import { Button } from "@/components/ui/button";
import { Icons } from "../icons";

const SocialAuthForm = () => {
    const isLoading = false;

    return (
        <div className="flex flex-col gap-2">
            <Button variant="outline" type="button" disabled={isLoading}>
                {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.gitHub className="mr-2 h-4 w-4" />
                )}{" "}
                GitHub
            </Button>

            <Button variant="outline" type="button" disabled={isLoading}>
                {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                )}{" "}
                Google
            </Button>
        </div>
    );
};

export default SocialAuthForm;
