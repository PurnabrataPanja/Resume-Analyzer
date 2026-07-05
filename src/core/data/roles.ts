import type { JobRoleProfile, SkillDefinition } from "@/core/domain/types";

function skill(
  id: string,
  label: string,
  aliases: string[],
  weight = 1,
): SkillDefinition {
  return { id, label, aliases: [label, ...aliases], weight };
}

const commonSections = [
  "contact",
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
];

export const jobRoles: JobRoleProfile[] = [
  {
    id: "frontend",
    title: "Frontend Developer",
    summary: "React, TypeScript, accessibility, performance, and UI delivery.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("react", "React", ["react.js", "reactjs"], 1.5),
      skill("typescript", "TypeScript", ["ts"], 1.4),
      skill("javascript", "JavaScript", ["js", "ecmascript"], 1.3),
      skill("html", "HTML", ["html5"], 1),
      skill("css", "CSS", ["css3", "sass", "scss"], 1),
      skill("accessibility", "Accessibility", ["a11y", "wcag"], 1),
      skill("testing", "Testing", ["jest", "vitest", "testing library"], 1),
    ],
    preferredSkills: [
      skill("nextjs", "Next.js", ["next js", "next"], 1.2),
      skill("performance", "Web performance", [
        "core web vitals",
        "lighthouse",
      ]),
      skill("tailwind", "Tailwind CSS", ["tailwind"]),
      skill("state", "State management", ["redux", "zustand", "context api"]),
    ],
  },
  {
    id: "backend",
    title: "Backend Developer",
    summary: "APIs, databases, security, testing, and reliable services.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("node", "Node.js", ["nodejs", "node"], 1.4),
      skill("api", "API design", ["rest", "rest api", "graphql"], 1.4),
      skill(
        "database",
        "Databases",
        ["postgresql", "mysql", "mongodb", "sql"],
        1.3,
      ),
      skill("auth", "Authentication", ["oauth", "jwt", "sessions"], 1),
      skill("testing", "Testing", ["unit testing", "integration testing"], 1),
      skill("security", "Security", ["owasp", "input validation"], 1),
    ],
    preferredSkills: [
      skill("docker", "Docker", ["containers", "containerization"]),
      skill("queues", "Queues", ["redis", "rabbitmq", "sqs"]),
      skill("observability", "Observability", [
        "logging",
        "metrics",
        "tracing",
      ]),
      skill("cloud", "Cloud", ["aws", "azure", "gcp"]),
    ],
  },
  {
    id: "fullstack",
    title: "Full Stack Developer",
    summary: "End-to-end product delivery across frontend, APIs, and data.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("typescript", "TypeScript", ["ts"], 1.4),
      skill("react", "React", ["react.js", "reactjs"], 1.3),
      skill("node", "Node.js", ["nodejs", "node"], 1.2),
      skill("api", "API design", ["rest", "graphql"], 1.2),
      skill("database", "Databases", ["postgresql", "mongodb", "sql"], 1.2),
      skill("testing", "Testing", ["jest", "vitest", "playwright"], 1),
    ],
    preferredSkills: [
      skill("nextjs", "Next.js", ["next js", "next"]),
      skill("deployment", "Deployment", ["vercel", "ci/cd", "github actions"]),
      skill("security", "Security", ["owasp", "secure coding"]),
      skill("ux", "UX", ["user experience", "accessibility"]),
    ],
  },
  {
    id: "mern-stack",
    title: "MERN Stack Developer",
    summary:
      "MongoDB, Express, React, Node.js, APIs, authentication, and deployment.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("mongodb", "MongoDB", ["mongoose", "atlas"], 1.4),
      skill("express", "Express.js", ["express", "express js"], 1.4),
      skill("react", "React", ["react.js", "reactjs"], 1.4),
      skill("node", "Node.js", ["nodejs", "node"], 1.4),
      skill("javascript", "JavaScript", ["js", "ecmascript"], 1.2),
      skill("api", "REST API", ["rest", "api design", "crud api"], 1.2),
      skill("auth", "Authentication", ["jwt", "bcrypt", "oauth"], 1),
    ],
    preferredSkills: [
      skill("typescript", "TypeScript", ["ts"]),
      skill("redux", "Redux", ["redux toolkit", "state management"]),
      skill("deployment", "Deployment", [
        "vercel",
        "render",
        "railway",
        "netlify",
      ]),
      skill("testing", "Testing", ["jest", "vitest", "supertest"]),
      skill("payments", "Payments", ["stripe", "razorpay"]),
    ],
  },
  {
    id: "django-developer",
    title: "Django Developer",
    summary:
      "Django, DRF, relational databases, admin workflows, auth, and deployment.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("python", "Python", ["python3"], 1.4),
      skill("django", "Django", ["django framework"], 1.6),
      skill("drf", "Django REST Framework", ["drf", "django rest"], 1.4),
      skill(
        "database",
        "PostgreSQL / SQL",
        ["postgresql", "postgres", "sql"],
        1.2,
      ),
      skill("auth", "Authentication", ["permissions", "sessions", "jwt"], 1),
      skill("testing", "Testing", ["pytest", "django test"], 1),
    ],
    preferredSkills: [
      skill("celery", "Celery", ["redis", "background tasks"]),
      skill("docker", "Docker", ["containers"]),
      skill("deployment", "Deployment", [
        "gunicorn",
        "nginx",
        "vercel",
        "railway",
      ]),
      skill("security", "Security", ["csrf", "owasp", "input validation"]),
    ],
  },
  {
    id: "spring-boot-developer",
    title: "Spring Boot Developer",
    summary:
      "Spring Boot APIs, microservices, persistence, security, and testable Java services.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("java", "Java", ["core java", "java 17"], 1.4),
      skill("spring-boot", "Spring Boot", ["springboot", "spring"], 1.6),
      skill(
        "spring-security",
        "Spring Security",
        ["oauth2", "jwt", "security"],
        1.2,
      ),
      skill("jpa", "JPA / Hibernate", ["hibernate", "spring data jpa"], 1.2),
      skill("api", "REST APIs", ["rest", "openapi", "swagger"], 1.2),
      skill(
        "testing",
        "JUnit / Mockito",
        ["junit", "mockito", "integration testing"],
        1,
      ),
    ],
    preferredSkills: [
      skill("microservices", "Microservices", [
        "service discovery",
        "api gateway",
      ]),
      skill("docker", "Docker", ["containers"]),
      skill("kafka", "Kafka", ["rabbitmq", "messaging"]),
      skill("observability", "Observability", [
        "actuator",
        "prometheus",
        "logs",
      ]),
    ],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    summary: "SQL, dashboards, analysis, visualization, and business insight.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("sql", "SQL", ["postgresql", "mysql", "queries"], 1.5),
      skill("excel", "Excel", ["spreadsheets", "pivot tables"], 1),
      skill(
        "visualization",
        "Data visualization",
        ["tableau", "power bi", "charts"],
        1.3,
      ),
      skill(
        "statistics",
        "Statistics",
        ["statistical analysis", "hypothesis"],
        1.2,
      ),
      skill("python", "Python", ["pandas", "numpy"], 1.2),
    ],
    preferredSkills: [
      skill("bi", "BI tools", ["looker", "metabase", "mode"]),
      skill("etl", "ETL", ["data cleaning", "data pipelines"]),
      skill("experimentation", "Experimentation", [
        "a/b testing",
        "cohort analysis",
      ]),
    ],
  },
  {
    id: "data-scientist",
    title: "Data Scientist / ML",
    summary: "Machine learning, statistics, Python, modeling, and evaluation.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("python", "Python", ["pandas", "numpy"], 1.5),
      skill("ml", "Machine learning", ["ml", "scikit-learn", "sklearn"], 1.5),
      skill(
        "statistics",
        "Statistics",
        ["probability", "statistical modeling"],
        1.3,
      ),
      skill("sql", "SQL", ["queries", "postgresql"], 1),
      skill(
        "evaluation",
        "Model evaluation",
        ["metrics", "cross validation"],
        1,
      ),
    ],
    preferredSkills: [
      skill("deep-learning", "Deep learning", [
        "pytorch",
        "tensorflow",
        "keras",
      ]),
      skill("nlp", "NLP", ["natural language processing", "transformers"]),
      skill("deployment", "Model deployment", ["mlops", "model serving"]),
    ],
  },
  {
    id: "devops",
    title: "DevOps / Cloud Engineer",
    summary: "Cloud, automation, CI/CD, observability, and resilient systems.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("linux", "Linux", ["unix", "shell"], 1.2),
      skill("cloud", "Cloud", ["aws", "azure", "gcp"], 1.5),
      skill("docker", "Docker", ["containers"], 1.2),
      skill("cicd", "CI/CD", ["github actions", "jenkins", "gitlab ci"], 1.3),
      skill(
        "iac",
        "Infrastructure as Code",
        ["terraform", "pulumi", "cloudformation"],
        1.2,
      ),
    ],
    preferredSkills: [
      skill("kubernetes", "Kubernetes", ["k8s", "helm"]),
      skill("observability", "Observability", [
        "prometheus",
        "grafana",
        "logging",
      ]),
      skill("security", "Security", ["secrets", "least privilege", "owasp"]),
    ],
  },
  {
    id: "qa-automation",
    title: "QA Automation Engineer",
    summary:
      "Automated testing, quality strategy, APIs, and release confidence.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("automation", "Test automation", ["automation testing"], 1.5),
      skill("selenium", "Selenium", ["webdriver"], 1.1),
      skill("playwright", "Playwright", ["cypress"], 1.2),
      skill("api-testing", "API testing", ["postman", "rest assured"], 1.2),
      skill("test-plans", "Test planning", ["test cases", "test strategy"], 1),
    ],
    preferredSkills: [
      skill("ci", "CI integration", ["github actions", "jenkins"]),
      skill("performance", "Performance testing", ["load testing", "jmeter"]),
      skill("accessibility", "Accessibility testing", ["axe", "wcag"]),
    ],
  },
  {
    id: "ux-designer",
    title: "UI/UX Designer",
    summary:
      "Research, interaction design, systems, prototyping, and usability.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("figma", "Figma", ["figjam"], 1.5),
      skill(
        "research",
        "User research",
        ["interviews", "usability testing"],
        1.3,
      ),
      skill("wireframes", "Wireframing", ["wireframe", "prototyping"], 1.2),
      skill("design-systems", "Design systems", ["component library"], 1.2),
      skill("accessibility", "Accessibility", ["wcag", "inclusive design"], 1),
    ],
    preferredSkills: [
      skill("analytics", "Product analytics", ["metrics", "funnels"]),
      skill("handoff", "Developer handoff", ["tokens", "specs"]),
      skill("content", "UX writing", ["microcopy", "content design"]),
    ],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    summary:
      "Strategy, discovery, roadmaps, metrics, and cross-functional delivery.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("roadmap", "Roadmapping", ["product roadmap"], 1.3),
      skill(
        "discovery",
        "Product discovery",
        ["user interviews", "customer discovery"],
        1.3,
      ),
      skill(
        "analytics",
        "Analytics",
        ["metrics", "kpis", "experimentation"],
        1.2,
      ),
      skill("prioritization", "Prioritization", ["rICE", "moscow"], 1),
      skill("stakeholders", "Stakeholder management", ["cross-functional"], 1),
    ],
    preferredSkills: [
      skill("sql", "SQL", ["queries"]),
      skill("agile", "Agile delivery", ["scrum", "kanban"]),
      skill("gtm", "Go-to-market", ["launch", "positioning"]),
    ],
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Analyst",
    summary:
      "Threat detection, risk, incident response, and secure operations.",
    expectedSections: commonSections,
    requiredSkills: [
      skill("security", "Security operations", ["soc", "siem"], 1.5),
      skill("incident", "Incident response", ["ir", "triage"], 1.3),
      skill("network", "Networking", ["tcp/ip", "dns", "firewalls"], 1.2),
      skill("risk", "Risk assessment", ["vulnerability management"], 1.2),
      skill("owasp", "OWASP", ["web security", "application security"], 1),
    ],
    preferredSkills: [
      skill("cloud-security", "Cloud security", [
        "aws security",
        "azure security",
      ]),
      skill("scripting", "Scripting", ["python", "powershell", "bash"]),
      skill("compliance", "Compliance", ["iso 27001", "soc 2", "nist"]),
    ],
  },
];

export const defaultRole = jobRoles[0];

export function getRoleById(roleId: string) {
  return jobRoles.find((role) => role.id === roleId) ?? defaultRole;
}
