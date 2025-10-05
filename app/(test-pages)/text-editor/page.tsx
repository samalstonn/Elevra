import UniversitySearch from "@/components/UniversitySearch";

export const metadata = {
	title: "Universities | Neighbor Vote",
	description: "Browse universities by name and country using a public API.",
};

export default function Page() {
	return (
		<main className="container mx-auto max-w-3xl px-4 py-8">
			<h1 className="mb-2 text-2xl font-semibold">Universities</h1>
			<p className="mb-6 text-sm text-muted-foreground">
				This is the text editor test page.
			</p>
			<UniversitySearch />
		</main>
	);
}
