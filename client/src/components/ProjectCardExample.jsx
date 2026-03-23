import ProjectCard from "./ProjectCard";

const sampleProjects = [
  {
    title: "The Silent Shadow",
    description:
      "A detective begins to lose his grip on reality while investigating a murder case.",
    genre: "Thriller",
    readTime: "6 min read",
    views: "3.4k",
    likes: 420,
  },
  {
    title: "City of Echoes",
    description:
      "A forgotten radio signal reconnects three strangers to a vanished underground movement.",
    genre: "Mystery",
    readTime: "8 min read",
    views: "5.1k",
    likes: 612,
  },
  {
    title: "Glass Horizon",
    description:
      "On a flooded future coastline, a young archivist uncovers a map that could redraw power forever.",
    genre: "Sci-Fi",
    readTime: "7 min read",
    views: "2.8k",
    likes: 305,
  },
];

const ProjectCardExample = () => {
  return (
    <section className="min-h-screen bg-[#050816] px-6 py-12 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">
            Featured Stories
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Modern Dark-Themed Project Cards
          </h2>
          <p className="mt-3 text-base leading-7 text-white/65">
            Responsive glassmorphism cards for scripts, stories, and cinematic projects.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {sampleProjects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectCardExample;
