# ReverseLearningAI - NestJS Backend Prompt Instructions

Use this file as context when prompting LLMs for further implementation.

## App Context

- **Name:** ReverseLearningAI (Backend)
- **Framework:** NestJS (Node.js)
- **Database:** MongoDB (using Mongoose)
- **Core Principle:** MVP-First. Keep the code simple and straight-forward, but strictly adhere to clean-code and NestJS best practices.

## Coding Syntax & Standards

1. **Modules & Dependency Injection:** Every feature must have its own module (e.g., `DocumentsModule`, `UserModule`). Avoid massive central modules.
2. **Controllers & Services:** Controllers ONLY handle HTTP routing, incoming DTO validation, and response formatting. ALL business logic and DB operations belong in Services.
3. **DTOs & Validation:** Always use `class-validator` and `class-transformer` for DTO validation.
4. **Schemas:** Use NestJS Mongoose decorators (`@Schema()`, `@Prop()`) for MongoDB models instead of plain Mongoose schemas.
5. **Async Processing:** For heavy tasks (like parsing 50MB PDFs), use background events (e.g., `@nestjs/event-emitter`) so the HTTP controller can return a lightning-fast `202 Accepted`.
6. **API Routes:** All API routes MUST be defined as constants (using `as const`) in a central file (e.g., `src/common/constants/route.ts`). Never hardcode route strings directly inside `@Controller()` or HTTP method decorators (`@Get()`, `@Post()`, etc.). Import and use the constants instead.

## Error Handling Guidelines

1. **Global Exceptions:** Throw standard NestJS exceptions (`BadRequestException`, `PayloadTooLargeException`, `InternalServerErrorException`) inside controllers and services.
2. **File Deletion Security:** If a file is uploaded but processing fails, ALWAYS delete the physical file in the `catch` or `finally` block to prevent disk space leaks.
3. **Graceful Failures:** Catch external errors (like OpenAI API timeouts or specific PDF parsing failures). Update the database status of the document to `FAILED` rather than crashing the Node process. Provide clear logged error messages using NestJS `Logger`.

## Example Prompt Pattern

When asking for new features, paste this exact block at the start of your prompt:

Act as a Senior NestJS Developer.
Context: We are building ReverseLearningAI, an app that ingests documents and simulates an AI student you teach.
Current Task: [Insert details here]
Rules:

- Write simple, MVP-ready code, strictly following standard NestJS modular architecture.
- Handle errors gracefully, throwing standard HTTP exceptions.
- For physical file processing, ensure local files are deleted unconditionally after parsing (using try/catch/finally).
- Always use route constants from `src/common/constants/route.ts` for controllers.
- Provide only the necessary `.ts` files to achieve this task.
