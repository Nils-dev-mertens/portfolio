export { getAbout, type About } from './src/queries/about';
export { getProjects, type Project, type ProjectCategory, PROJECT_CATEGORIES } from './src/queries/projects';
export {
  getArticles,
  getArticleBySlug,
  getArticleById,
  slugify,
  uniqueSlug,
  type Article,
  type ArticleStatus,
  ARTICLE_STATUSES,
} from './src/queries/articles';
export {
  renderMarkdown,
  type MarkdownHeading,
  type RenderedMarkdown,
} from './src/markdown';
export { getSkillCategories, type SkillCategory, type SkillItem } from './src/queries/skills';
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
