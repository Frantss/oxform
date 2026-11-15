import { defineForm } from '../form';
import { acceptAll, type Login, loginDefaults } from './schema';

/** Diagnostic: the builder runtime alone, with no extension. */
export const form = defineForm({ name: 'builder', schema: acceptAll<Login>(), defaultValues: loginDefaults });
