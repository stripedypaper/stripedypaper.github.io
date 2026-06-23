export const DEFAULT_QUESTIONNAIRE_VERSION = '2026-06-22-v2';

const SUPPORTED_QUESTIONNAIRE_VERSIONS = new Set([
  '2026-06-20-v1',
  DEFAULT_QUESTIONNAIRE_VERSION
]);

export function resolveQuestionnaireVersion(search = '') {
  if (typeof window === 'undefined' && !search) {
    return DEFAULT_QUESTIONNAIRE_VERSION;
  }

  const params = new URLSearchParams(
    typeof search === 'string' ? search : window.location.search
  );
  const value = params.get('questionnaireVersion') || '';

  return SUPPORTED_QUESTIONNAIRE_VERSIONS.has(value)
    ? value
    : DEFAULT_QUESTIONNAIRE_VERSION;
}

export function withQuestionnaireVersion(path, questionnaireVersion) {
  const params = new URLSearchParams();
  params.set(
    'questionnaireVersion',
    questionnaireVersion || DEFAULT_QUESTIONNAIRE_VERSION
  );
  return `${path}?${params.toString()}`;
}
