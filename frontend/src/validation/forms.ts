import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "O username deve possuir ao menos 3 caracteres.");

const passwordSchema = z
  .string()
  .min(
    8,
    "A senha deve conter ao menos 8 caracteres, uma letra maiúscula e um número.",
  )
  .regex(
    /^(?=.*[A-Z])(?=.*\d).+$/,
    "A senha deve conter ao menos 8 caracteres, uma letra maiúscula e um número.",
  );

export const loginFormSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const registerFormSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const transferFormSchema = z
  .object({
    recipientUsername: usernameSchema,
    transferAmount: z
      .number()
      .refine(
        (value) => Number.isFinite(value),
        "Informe um valor válido para a transferência.",
      )
      .positive("O valor deve ser maior que zero.")
      .refine(
        (value) => decimalPlaces(value) <= 2,
        "Informe um valor maior que zero com no máximo 2 casas decimais, como 2,45.",
      ),
    currentUsername: z.string().trim().toLowerCase().min(3).optional(),
  })
  .superRefine((data, context) => {
    if (
      data.currentUsername &&
      data.recipientUsername === data.currentUsername
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipientUsername"],
        message: "Não é permitido transferir para o próprio usuário.",
      });
    }
  });

export function getFirstValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Os dados informados são inválidos.";
}

function decimalPlaces(value: number): number {
  const normalized = value.toString();
  const decimalPart = normalized.split(".")[1];
  return decimalPart?.length ?? 0;
}
