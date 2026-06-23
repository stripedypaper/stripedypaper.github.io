import { QUESTIONNAIRE_VERSION_V4 } from './rankings-config-v4.mjs';

export const ACTIVE_QUESTIONNAIRE_VERSION = QUESTIONNAIRE_VERSION_V4;

export function resolveQuestionnaireVersion(value) {
  return ACTIVE_QUESTIONNAIRE_VERSION;
}
