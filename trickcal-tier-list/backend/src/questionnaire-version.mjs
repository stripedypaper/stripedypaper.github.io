import { QUESTIONNAIRE_VERSION } from './rankings-config.mjs';
import { QUESTIONNAIRE_VERSION_V2 } from './rankings-config-v2.mjs';

export const LEGACY_QUESTIONNAIRE_VERSION = QUESTIONNAIRE_VERSION;
export const ACTIVE_QUESTIONNAIRE_VERSION = QUESTIONNAIRE_VERSION_V2;

const SUPPORTED_QUESTIONNAIRE_VERSIONS = new Set([
  LEGACY_QUESTIONNAIRE_VERSION,
  ACTIVE_QUESTIONNAIRE_VERSION
]);

export function resolveQuestionnaireVersion(value) {
  const normalized =
    typeof value === 'string' ? value.trim() : LEGACY_QUESTIONNAIRE_VERSION;

  if (SUPPORTED_QUESTIONNAIRE_VERSIONS.has(normalized)) {
    return normalized;
  }

  return LEGACY_QUESTIONNAIRE_VERSION;
}

export function isQuestionnaireVersionV2(value) {
  return resolveQuestionnaireVersion(value) === ACTIVE_QUESTIONNAIRE_VERSION;
}
