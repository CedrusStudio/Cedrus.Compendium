import { displayedText } from "@/presentation/translations";
import { toast } from "sonner"

function onError(error: Error, position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right") 
{
    toast(displayedText.error, {
        description: (
            <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                <code className="text-white">{error.message}</code>
            </pre>
        ),
        position
    });
};

function onSuccess(sideEffect: () => void, position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right")
{
    toast(displayedText.success, {
        description: (
            <p className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4 text-primary">
                {displayedText.characterUpdatedSuccessfully}
            </p>
        ),
        position
    });

    sideEffect();
}

export { onError, onSuccess };