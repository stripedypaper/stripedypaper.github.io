import { QUESTIONNAIRE_VERSION } from './rankings-config.mjs';
import { QUESTIONNAIRE_VERSION_V2 } from './rankings-config-v2.mjs';
import { QUESTIONNAIRE_VERSION_V4 } from './rankings-config-v4.mjs';

export const LEGACY_QUESTIONNAIRE_VERSION = QUESTIONNAIRE_VERSION;
export const ACTIVE_QUESTIONNAIRE_VERSION = QUESTIONNAIRE_VERSION_V4;

const SUPPORTED_QUESTIONNAIRE_VERSIONS = new Set([
  LEGACY_QUESTIONNAIRE_VERSION,
  QUESTIONNAIRE_VERSION_V2,
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
  return resolveQuestionnaireVersion(value) === QUESTIONNAIRE_VERSION_V2;
}

export function isQuestionnaireVersionV4(value) {
  return resolveQuestionnaireVersion(value) === QUESTIONNAIRE_VERSION_V4;
}
