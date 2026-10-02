// Libraries
import React from "react";
import { Edit, Plus, X } from "lucide-react";
import {
    ControllerRenderProps,
    Control,
    FieldValues,
    useFieldArray,
    useFormContext,
} from "react-hook-form";

// Components
import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps {
    name: string;
    label: string;
    type?:
        | "text"
        | "email"
        | "tel"
        | "textarea"
        | "number"
        | "select"
        | "multi-select"
        | "switch"
        | "password"
        | "multi-input";
    placeholder?: string;
    options?: { value: string; label: string }[];
    className?: string;
    labelClassName?: string;
    inputClassName?: string;
    value?: string;
    disabled?: boolean;
    isIcon?: boolean;
    initialValue?: string | number | boolean | string[];
}

export const CustomFormField: React.FC<FormFieldProps> = ({
    name,
    label,
    type = "text",
    placeholder,
    options,
    className,
    inputClassName,
    labelClassName,
    disabled = false,
    isIcon = false,
    initialValue,
}) => {
    const { control } = useFormContext();

    const renderFormControl = (
        field: ControllerRenderProps<FieldValues, string>
    ) => {
        switch (type) {
            case "textarea":
                return (
                    <Textarea
                        placeholder={placeholder}
                        {...field}
                        rows={3}
                        className={`border-input bg-background p-4 text-foreground placeholder:text-muted-foreground ${inputClassName}`}
                        disabled={disabled}
                        value={field.value ?? ""}
                    />
                );
            case "select":
                return (
                    <Select
                        value={field.value || (initialValue as string)}
                        onValueChange={field.onChange}
                        disabled={disabled}
                    >
                        <SelectTrigger
                            className={`w-full border-input bg-background p-4 text-foreground ${inputClassName}`}
                        >
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent className="w-full border-border bg-popover text-popover-foreground shadow">
                            {options?.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="cursor-pointer hover:!bg-accent hover:!text-accent-foreground"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "multi-select":
                return (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {options?.map((option) => {
                            const selected =
                                Array.isArray(field.value) &&
                                field.value.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={selected}
                                    disabled={disabled}
                                    onClick={() =>
                                        field.onChange(
                                            selected
                                                ? (
                                                      field.value as string[]
                                                  ).filter(
                                                      (value) =>
                                                          value !== option.value
                                                  )
                                                : [
                                                      ...(Array.isArray(
                                                          field.value
                                                      )
                                                          ? field.value
                                                          : []),
                                                      option.value,
                                                  ]
                                        )
                                    }
                                    className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-4 py-2 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}
                                >
                                    <span>{option.label}</span>
                                    <span className="text-xs">
                                        {selected ? "✓" : "+"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                );
            case "switch":
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id={name}
                            className={`text-customgreys-dirtyGrey ${inputClassName}`}
                        />
                        <FormLabel htmlFor={name} className={labelClassName}>
                            {label}
                        </FormLabel>
                    </div>
                );
            case "number":
                return (
                    <div className="flex items-center overflow-hidden rounded-md border border-input bg-background text-foreground focus-within:ring-2 focus-within:ring-ring/50">
                        <Input
                            type="number"
                            placeholder={placeholder}
                            {...field}
                            className={`h-11 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0 ${inputClassName}`}
                            disabled={disabled}
                            value={field.value ?? ""}
                            onChange={(e) =>
                                field.onChange(
                                    e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value)
                                )
                            }
                        />
                        <div className="flex shrink-0 border-l border-border">
                            <button
                                type="button"
                                aria-label={`Decrease ${label}`}
                                disabled={
                                    disabled || Number(field.value ?? 0) <= 0
                                }
                                onClick={() =>
                                    field.onChange(
                                        Math.max(
                                            0,
                                            Number(field.value || 0) - 1
                                        )
                                    )
                                }
                                className="flex size-11 items-center justify-center border-r border-border text-lg hover:bg-accent disabled:opacity-40"
                            >
                                −
                            </button>
                            <button
                                type="button"
                                aria-label={`Increase ${label}`}
                                disabled={disabled}
                                onClick={() =>
                                    field.onChange(Number(field.value || 0) + 1)
                                }
                                className="flex size-11 items-center justify-center text-lg hover:bg-accent disabled:opacity-40"
                            >
                                +
                            </button>
                        </div>
                    </div>
                );
            case "multi-input":
                return (
                    <MultiInputField
                        name={name}
                        control={control}
                        placeholder={placeholder}
                        inputClassName={inputClassName}
                    />
                );
            default:
                return (
                    <Input
                        type={type}
                        placeholder={placeholder}
                        {...field}
                        className={`border-input bg-background p-4 text-foreground placeholder:text-muted-foreground ${inputClassName}`}
                        disabled={disabled}
                        value={field.value ?? ""}
                    />
                );
        }
    };

    return (
        <FormField
            control={control}
            name={name}
            defaultValue={initialValue}
            render={({ field }) => (
                <FormItem
                    className={`${
                        type !== "switch" && "rounded-md"
                    } relative ${className}`}
                >
                    {type !== "switch" && (
                        <div className="flex justify-between items-center">
                            <FormLabel className={`text-sm ${labelClassName}`}>
                                {label}
                            </FormLabel>

                            {!disabled && isIcon && type !== "multi-input" && (
                                <Edit className="size-4 text-customgreys-dirtyGrey" />
                            )}
                        </div>
                    )}
                    <FormControl>
                        {renderFormControl({
                            ...field,
                            value:
                                field.value !== undefined
                                    ? field.value
                                    : initialValue,
                        })}
                    </FormControl>
                    <FormMessage className="text-red-400" />
                </FormItem>
            )}
        />
    );
};
interface MultiInputFieldProps {
    name: string;
    control: Control<FieldValues>;
    placeholder?: string;
    inputClassName?: string;
}

const MultiInputField: React.FC<MultiInputFieldProps> = ({
    name,
    control,
    placeholder,
    inputClassName,
}) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name,
    });

    return (
        <div className="space-y-2">
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                    <FormField
                        control={control}
                        name={`${name}.${index}`}
                        render={({ field }) => (
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={placeholder}
                                    className={`flex-1 border-input bg-background p-4 text-foreground placeholder:text-muted-foreground ${inputClassName}`}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                        )}
                    />
                    <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="ghost"
                        size="icon"
                        className="text-customgreys-dirtyGrey"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                onClick={() => append("")}
                variant="outline"
                size="sm"
                className="mt-2 text-customgreys-dirtyGrey"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
            </Button>
        </div>
    );
};
