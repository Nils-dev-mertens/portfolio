export { getAbout, type About } from './src/queries/about';
export { getProjects, type Project, type ProjectCategory, PROJECT_CATEGORIES } from './src/queries/projects';
export { getWorkExperience, type WorkExperience } from './src/queries/work_experience';
export { getEducation, type Education } from './src/queries/education';
export {
  getGithubActivity,
  getGithubContributions,
  type GithubActivity,
  type GithubContribution,
} from './src/queries/github';
export { startScheduler } from './src/scheduler';

export { getDb } from './src/db';
export * from './src/db/schema';
export * from './src/seed';

export { type Lang, t, pick } from './src/i18n';
