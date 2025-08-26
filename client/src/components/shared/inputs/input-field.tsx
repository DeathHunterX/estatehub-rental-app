import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { HTMLInputTypeAttribute, InputHTMLAttributes } from "react";
import { FieldValues, Path, useFormContext } from "react-hook-form";

type InputFieldProps<S extends FieldValues> = {
    nameInSchema: keyof S;
    label: string;
    placeholder?: string;
    className?: string;
    type?: HTMLInputTypeAttribute;
} & InputHTMLAttributes<HTMLInputElement>;

const InputField = <S extends FieldValues>({
    nameInSchema,
    label,
    placeholder,
    className = "",
    type = "text",
    ...props
}: InputFieldProps<S>) => {
    const form = useFormContext<S>();

    return (
        <FormField
            control={form.control}
            name={nameInSchema as Path<S>}
            render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                    <FormLabel
                        className="flex items-start"
                        htmlFor={nameInSchema as string}
                    >
                        {label}
                    </FormLabel>
                    <FormControl>
                        <Input
                            id={nameInSchema as string}
                            type={type}
                            className={` rounded-md border ${className}`}
                            placeholder={
                                placeholder ?? `Enter ${field.name}...`
                            }
                            {...field}
                            {...props}
                        />
                    </FormControl>
                    <FormMessage className="text-left" />
                </FormItem>
            )}
        />
    );
};

export default InputField;
