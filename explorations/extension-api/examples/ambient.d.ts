// Stand-ins for the application code and schemas the examples call. They are not part of the API.
type Schema = import('@standard-schema/spec').StandardSchemaV1<any>;

declare function save(values: unknown): Promise<void>;
declare function pay(values: unknown): Promise<void>;
declare function confirmLeaving(values: unknown): boolean;
declare const analytics: { track(event: string, successful: boolean): void };
declare const api: { saveDraft(draft: unknown): Promise<void> };

declare const noticeSchema: Schema;
declare const stockSchema: Schema;
declare const passwordRulesSchema: (values: unknown) => Schema;
declare const weakPasswordSchema: (values: unknown) => Schema;
declare const weakPhoneSchema: (values: unknown) => Schema;
declare const zipRulesSchema: (values: unknown) => Schema;
