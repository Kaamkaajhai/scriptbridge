const WRITER_ROLES = new Set(["writer", "creator"]);
const INDUSTRY_ROLES = new Set(["investor", "producer", "director", "professional", "industry"]);

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const hasTruthy = (value) => Boolean(value);

const normalizeRole = (role) => String(role || "").toLowerCase().trim();

const buildCommonRequiredChecks = (user) => [
  hasText(user?.name),
  hasText(user?.email),
  Boolean(user?.emailVerified),
];

const buildWriterRequiredChecks = (user) => {
  const writerProfile = user?.writerProfile || {};
  const diversity = writerProfile?.diversity || {};

  return [
    hasText(writerProfile?.username),
    hasText(user?.bio),
    hasText(diversity?.gender),
    hasText(diversity?.nationality),
    hasTruthy(user?.privacyPolicyAccepted),
    hasTruthy(writerProfile?.onboardingComplete),
  ];
};

const buildIndustryRequiredChecks = (user) => {
  const industryProfile = user?.industryProfile || {};

  return [
    hasText(industryProfile?.subRole),
    hasText(industryProfile?.company),
    hasText(industryProfile?.jobTitle),
    hasTruthy(user?.privacyPolicyAccepted),
    hasTruthy(industryProfile?.onboardingComplete),
  ];
};

export const getProfileCompletion = (user = {}) => {
  const role = normalizeRole(user?.role);
  const commonChecks = buildCommonRequiredChecks(user);

  if (WRITER_ROLES.has(role) && user?.writerProfile?.onboardingComplete) {
    return {
      percentage: 100,
      completedFields: commonChecks.length + buildWriterRequiredChecks(user).length,
      totalFields: commonChecks.length + buildWriterRequiredChecks(user).length,
      isComplete: true,
    };
  }

  if (INDUSTRY_ROLES.has(role) && user?.industryProfile?.onboardingComplete) {
    return {
      percentage: 100,
      completedFields: commonChecks.length + buildIndustryRequiredChecks(user).length,
      totalFields: commonChecks.length + buildIndustryRequiredChecks(user).length,
      isComplete: true,
    };
  }

  const checks = [...commonChecks];

  if (WRITER_ROLES.has(role)) {
    checks.push(...buildWriterRequiredChecks(user));
  } else if (INDUSTRY_ROLES.has(role)) {
    checks.push(...buildIndustryRequiredChecks(user));
  }

  const totalFields = checks.length;
  const completedFields = checks.filter(Boolean).length;
  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100;

  return {
    percentage,
    completedFields,
    totalFields,
    isComplete: completedFields === totalFields,
  };
};
